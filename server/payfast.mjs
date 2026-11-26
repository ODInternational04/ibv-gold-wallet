import { createHash, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class PaymentError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const phpEncode = (value) =>
  encodeURIComponent(String(value))
    .replace(
      /[!'()*~]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    )
    .replace(/%20/g, "+");
export function parameterString(fields, checkout = false) {
  return Object.entries(fields)
    .filter(
      ([key, value]) => key !== "signature" && (!checkout || value !== ""),
    )
    .map(
      ([key, value]) =>
        `${key}=${phpEncode(checkout ? String(value).trim() : value)}`,
    )
    .join("&");
}
export function signature(fields, passphrase, checkout = false) {
  const encoded = parameterString(fields, checkout);
  return createHash("md5")
    .update(`${encoded}&passphrase=${phpEncode(passphrase.trim())}`)
    .digest("hex");
}
export function verifySignature(fields, passphrase) {
  if (!/^[a-f0-9]{32}$/i.test(fields.signature ?? "")) return false;
  return timingSafeEqual(
    Buffer.from(signature(fields, passphrase), "hex"),
    Buffer.from(fields.signature, "hex"),
  );
}
export function cents(value) {
  if (!/^\d+\.\d{2}$/.test(String(value)))
    throw new PaymentError(400, "Invalid payment amount");
  const result = Number(String(value).replace(".", ""));
  if (!Number.isSafeInteger(result) || result <= 0)
    throw new PaymentError(400, "Invalid payment amount");
  return result;
}
export function config(env = process.env) {
  const mode = env.PAYFAST_MODE ?? "live";
  if (!["live", "sandbox"].includes(mode))
    throw new PaymentError(503, "Payment mode is not configured correctly");
  for (const key of [
    "PAYFAST_MERCHANT_ID",
    "PAYFAST_MERCHANT_KEY",
    "PAYFAST_PASSPHRASE",
    "APP_BASE_URL",
  ]) {
    if (!env[key]?.trim())
      throw new PaymentError(
        503,
        `Payments are awaiting configuration: ${key}`,
      );
  }
  if (!/^\d{8}$/.test(env.PAYFAST_MERCHANT_ID.trim()))
    throw new PaymentError(503, "Merchant account is not configured correctly");
  const site = new URL(env.APP_BASE_URL);
  if (
    site.protocol !== "https:" ||
    site.username ||
    site.password ||
    site.pathname !== "/" ||
    site.search ||
    site.hash
  )
    throw new PaymentError(
      503,
      "APP_BASE_URL must be your public HTTPS website origin",
    );
  if (mode === "live" && env.PAYFAST_MERCHANT_ID.trim() === "10000100")
    throw new PaymentError(
      503,
      "Sandbox credentials cannot be used for live payments",
    );
  const host = mode === "live" ? "www.payfast.co.za" : "sandbox.payfast.co.za";
  return {
    mode,
    host,
    site: site.origin,
    merchantId: env.PAYFAST_MERCHANT_ID.trim(),
    merchantKey: env.PAYFAST_MERCHANT_KEY.trim(),
    passphrase: env.PAYFAST_PASSPHRASE,
    action: `https://${host}/eng/process`,
  };
}
export function checkoutFields(settings, order, email) {
  const fields = {
    merchant_id: settings.merchantId,
    merchant_key: settings.merchantKey,
    return_url: `${settings.site}/app/dashboard?payment=returned&order=${order.id}`,
    cancel_url: `${settings.site}/app/transact?payment=cancelled`,
    notify_url: `${settings.site}/api/payfast/notify`,
    email_address: email,
    m_payment_id: order.id,
    amount: (Number(order.amount_cents) / 100).toFixed(2),
    item_name: order.product_name.slice(0, 100),
  };
  fields.signature = signature(fields, settings.passphrase, true);
  return fields;
}
export async function readBody(req, form = false) {
  if (Number(req.headers["content-length"] ?? 0) > 65536)
    throw new PaymentError(413, "Request is too large");
  let body = req.body;
  if (body == null) {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > 65536) throw new PaymentError(413, "Request is too large");
      chunks.push(Buffer.from(chunk));
    }
    body = Buffer.concat(chunks).toString("utf8");
  }
  if (Buffer.isBuffer(body)) body = body.toString("utf8");
  if (typeof body === "string") {
    if (body.length > 65536)
      throw new PaymentError(413, "Request is too large");
    if (form) {
      const params = new URLSearchParams(body);
      const entries = [...params];
      if (new Set(entries.map(([k]) => k)).size !== entries.length)
        throw new PaymentError(400, "Duplicate notification fields");
      body = Object.fromEntries(entries);
    } else {
      try {
        body = JSON.parse(body);
      } catch {
        throw new PaymentError(400, "Invalid JSON");
      }
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new PaymentError(400, "Invalid request body");
  if (
    form &&
    Object.entries(body).some(
      ([key, value]) => !/^\w+$/.test(key) || typeof value !== "string",
    )
  )
    throw new PaymentError(400, "Invalid notification fields");
  return body;
}
export async function validSource(req, settings, resolver = lookup) {
  const raw =
    process.env.VERCEL === "1"
      ? req.headers["x-vercel-forwarded-for"]
      : req.socket?.remoteAddress;
  const ip = String(raw ?? "").replace(/^::ffff:/, "");
  if (!isIP(ip)) return false;
  const hosts =
    settings.mode === "live"
      ? ["www.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za"]
      : ["sandbox.payfast.co.za"];
  const resolved = await Promise.allSettled(
    hosts.map((host) => resolver(host, { all: true })),
  );
  const addresses = resolved
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value.map((entry) => entry.address));
  if (!addresses.length)
    throw new PaymentError(
      503,
      "Payment source lookup temporarily unavailable",
    );
  return addresses.includes(ip);
}
export function sendError(res, error) {
  const status = error instanceof PaymentError ? error.status : 503;
  // Never log request bodies, signatures, credentials or personal payment data.
  if (status >= 500)
    console.error(
      "PayFast request could not complete",
      error instanceof PaymentError
        ? error.message
        : "Payment service unavailable",
    );
  return res
    .status(status)
    .json({
      error:
        error instanceof PaymentError
          ? error.message
          : "The payment service is temporarily unavailable. Please try again.",
    });
}
