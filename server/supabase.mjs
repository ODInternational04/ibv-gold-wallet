import { createClient } from "@supabase/supabase-js";
import { PaymentError } from "./payfast.mjs";

export function databaseConfig(env = process.env, service = false) {
  const first = (...values) => values.map(value => value?.trim()).find(Boolean);
  const url = first(env.SUPABASE_URL, env.VITE_SUPABASE_URL);
  if (!url) throw new PaymentError(503, "Missing Vercel variable: SUPABASE_URL (or VITE_SUPABASE_URL). Set it for Production and redeploy.");
  const key = service
    ? first(env.SUPABASE_SERVICE_ROLE_KEY, env.SUPABASE_SECRET_KEY)
    : first(env.SUPABASE_PUBLISHABLE_KEY, env.VITE_SUPABASE_PUBLISHABLE_KEY);
  if (!key) throw new PaymentError(503, service
    ? "Missing Vercel variable: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY). Use your project's server secret key, set it for Production, and redeploy."
    : "Missing Vercel variable: VITE_SUPABASE_PUBLISHABLE_KEY. Set it for Production and redeploy.");
  if (service && key.startsWith('sb_publishable_')) throw new PaymentError(503, "The server database variable contains a publishable key. Use a Supabase secret or service-role key instead.");
  return { url, key };
}

export function database(token = null, service = false) {
  const { url, key } = databaseConfig(process.env, service);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(token
      ? { global: { headers: { Authorization: `Bearer ${token}` } } }
      : {}),
  });
}
