import {
  config,
  verifySignature,
  parameterString,
  readBody,
  cents,
  validSource,
  PaymentError,
  sendError,
} from "../../server/payfast.mjs";
import { database } from "../../server/supabase.mjs";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }
  try {
    const settings = config();
    if (
      !String(req.headers["content-type"] ?? "")
        .toLowerCase()
        .startsWith("application/x-www-form-urlencoded")
    )
      throw new PaymentError(415, "Expected a PayFast form notification");
    const data = await readBody(req, true);
    if (
      data.merchant_id !== settings.merchantId ||
      !verifySignature(data, settings.passphrase)
    )
      throw new PaymentError(403, "Invalid payment notification");
    if (!(await validSource(req, settings)))
      throw new PaymentError(403, "Invalid payment source");
    if (
      !/^[a-f0-9-]{36}$/i.test(data.m_payment_id ?? "") ||
      !/^\d{1,100}$/.test(data.pf_payment_id ?? "")
    )
      throw new PaymentError(400, "Invalid payment reference");
    const amount = cents(data.amount_gross);
    const db = database(null, true);
    const { data: order, error } = await db
      .from("payment_orders")
      .select("id,amount_cents,payment_mode")
      .eq("id", data.m_payment_id)
      .single();
    if (error || !order) throw new PaymentError(400, "Unknown payment order");
    if (
      Number(order.amount_cents) !== amount ||
      order.payment_mode !== settings.mode
    )
      throw new PaymentError(400, "Payment does not match the order");
    const validation = await fetch(
      `https://${settings.host}/eng/query/validate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: parameterString(data),
        redirect: "error",
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!validation.ok || !(await validation.text()).trim().match(/^VALID$/))
      throw new PaymentError(503, "Payment confirmation is not yet available");
    if (data.payment_status === "COMPLETE") {
      const { error: settlementError } = await db.rpc("settle_payfast_order", {
        p_order: order.id,
        p_payment: data.pf_payment_id,
        p_amount: amount,
        p_mode: settings.mode,
      });
      if (settlementError)
        throw new PaymentError(
          503,
          "Payment could not be recorded. PayFast will retry confirmation.",
        );
    }
    return res.status(200).send("OK");
  } catch (error) {
    return sendError(res, error);
  }
}
