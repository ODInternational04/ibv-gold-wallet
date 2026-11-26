import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const env = Object.fromEntries(
  (await readFile(".env.local", "utf8"))
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const i = line.indexOf("=");
      return [
        line.slice(0, i),
        line
          .slice(i + 1)
          .trim()
          .replace(/^['"]|['"]$/g, ""),
      ];
    }),
);
const headers = {
  apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
  "Content-Type": "application/json",
};
const products = await fetch(
  `${env.VITE_SUPABASE_URL}/rest/v1/products?select=id,sku,price_cents,redemption_value_cents,active`,
  { headers },
);
assert.equal(products.status, 200, "Published product API is available");
const rows = await products.json();
assert(
  rows.length >= 4 && rows.every((p) => p.active && p.price_cents > 0),
  "Active priced catalog returned",
);
const stats = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/rpc/admin_stats`, {
  method: "POST",
  headers,
  body: "{}",
});
assert(
  [401, 403].includes(stats.status),
  "Anonymous users cannot read admin statistics",
);
const withdrawals = await fetch(
  `${env.VITE_SUPABASE_URL}/rest/v1/withdrawal_requests?select=id`,
  { headers },
);
assert(
  [401, 403].includes(withdrawals.status),
  "Anonymous users cannot read withdrawals",
);
console.log("PASS: live catalog API and anonymous access restrictions.");
