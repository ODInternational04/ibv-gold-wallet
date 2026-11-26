import {
  config,
  checkoutFields,
  readBody,
  PaymentError,
  sendError,
} from "../../server/payfast.mjs";
import { database } from "../../server/supabase.mjs";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const settings = config();
    if (req.headers.origin && req.headers.origin !== settings.site)
      throw new PaymentError(
        403,
        "Checkout must be opened from the configured website",
      );
    const token = /^Bearer (\S+)$/.exec(req.headers.authorization ?? "")?.[1];
    if (!token) throw new PaymentError(401, "Sign in before checking out");
    const db = database(token);
    const {
      data: { user },
      error: authError,
    } = await db.auth.getUser(token);
    if (authError || !user?.email)
      throw new PaymentError(401, "Please sign in again");
    // Do not accept payment unless the callback can access the settlement service.
    const service = database(null, true);
    const { error: serviceError } = await service
      .from("payment_orders")
      .select("id", { head: true })
      .limit(1);
    if (serviceError)
      throw new PaymentError(
        503,
        "Payments are awaiting valid server database credentials",
      );
    const body = await readBody(req);
    if (
      !uuid.test(body.productId) ||
      !uuid.test(body.requestKey) ||
      !Number.isSafeInteger(body.expectedPriceCents) ||
      body.expectedPriceCents <= 0
    )
      throw new PaymentError(400, "Invalid checkout request");
    const { data: order, error } = await db
      .rpc("create_payfast_order", {
        p_product: body.productId,
        p_key: body.requestKey,
        p_expected: body.expectedPriceCents,
        p_mode: settings.mode,
      })
      .single();
    if (error) throw new PaymentError(400, error.message);
    return res
      .status(200)
      .json({
        action: settings.action,
        fields: checkoutFields(settings, order, user.email),
        orderId: order.id,
        mode: settings.mode,
      });
  } catch (error) {
    return sendError(res, error);
  }
}
