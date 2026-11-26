import { createClient } from "@supabase/supabase-js";
import { PaymentError } from "./payfast.mjs";

export function database(token = null, service = false) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = service
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new PaymentError(503, "Payments are awaiting database configuration");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(token
      ? { global: { headers: { Authorization: `Bearer ${token}` } } }
      : {}),
  });
}
