const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

**Welcome to your Base44 project** 

**About**

View and Edit  your app on [db.com](http://db.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.db.app
```

Run the app: `npm run dev`

**Publish your changes**

Open [db.com](http://db.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.db.com/Integrations/Using-GitHub](https://docs.db.com/Integrations/Using-GitHub)

Support: [https://app.db.com/support](https://app.db.com/support)

## Admin operations

The customer navigation includes **My Wallet** at `/app/wallet`, with all confirmed
purchases, original purchase amounts, owned quantities, current admin-based
redemption values, search and pagination. It is restricted to the signed-in
customer's records. The dashboard's View All link opens this page.

Run `npm run dev` and open `/admin/login`. Sign in with the existing Supabase
account assigned `admin` in `public.user_roles`. The dashboard is at `/admin`.

- **Products & prices:** add or edit products, upload JPG/PNG/WebP photos (5 MB
  maximum), set ZAR prices, and publish or hide products. The customer catalog
  refreshes every 15 seconds. Hiding a product preserves its record.
- **Customers:** view identity status and cash balances. Record settled cash only
  after independently reconciling a real payment or sale. Each settlement requires
  a unique reference. This action does not collect money or sell gold.
- **Redemption values:** open `/admin/redemptions` to set a separate redemption
  amount in ZAR for each product. Active products with a configured value appear
  at `/app/vault`; customer values refresh every 15 seconds. New products need a
  redemption value set here before they appear in the vault. Purchase prices stay
  independent. Existing products started with their previous displayed amounts.
  The dashboard and vault balance summary use these admin values for each owned
  product, multiplied by the number of units held (including fractional coins).
  They do not use spot or purchase prices. Values refresh every 15 seconds; if a
  holding has no unambiguous admin quote, the total shows awaiting admin valuation.
  Historical product names with fractional symbols (such as `¼oz` and `1/4oz`)
  are matched consistently. Existing holdings are linked to stable product IDs
  and unit-weight snapshots so subsequent product renames do not detach quotes.
- **Withdrawals:** customers request withdrawals under Transact → Withdraw. Only
  verified customers with sufficient settled cash can submit requests. Funds are
  reserved atomically. Verify bank ownership before approval, mark processing when
  initiating the transfer, and mark paid only after bank confirmation with its
  unique reference. Rejected or definitively failed transfers release reservations.
  Never mark an unknown bank outcome failed: funds must stay reserved until resolved.
- **Notifications:** new requests create persistent alerts for every admin. The
  portal polls every 15 seconds while open; each admin has their own read receipts.
  Customers receive in-wallet status alerts. Email/SMS and automatic bank payouts
  are not configured.
- **Overview:** customer and verification counts, active products, open and paid
  withdrawals, settled/available/reserved cash, and a seven-day request chart.

The backend is installed in the existing `rivvsywzrmhfqesyervu` Supabase project.
Its source is `supabase/migrations/20261126074941_admin_backend.sql`. It requires
the existing transactions, verification and role tables. Do not rerun an applied
migration or replay the older manual setup scripts against an installed project.
Keep `wallet_private` out of the Supabase API's exposed schemas.

Money is stored as integer cents. Customers have read-only access to their own
cash accounts, ledger and requests; validated database functions perform changes.
The cash ledger is independent of gold transactions. PayFast checkout is created
server-side from a verified customer's selected product and its current database
price. Browser return URLs cannot confirm payments. Only a validated PayFast
notification can settle an order and add purchased gold to holdings; it never
creates withdrawable cash. Sandbox orders never credit real holdings.

Validation:

```text
npm run build
node scripts/verify-wallet-api.mjs
node scripts/wallet-db.mjs scripts/test-wallet-backend.sql
node scripts/wallet-db.mjs scripts/verify-wallet-schema.sql
node scripts/wallet-db.mjs --security-advisors
```

The database helper reads a one-line JSON object containing `token` from hidden
standard input. Use a Supabase personal access token authorized for this project;
never put it in source, environment files, browser code, or command arguments.
The integration SQL creates temporary fixtures within a transaction and rolls
them all back. It covers authorization, balance reservation, duplicate requests,
duplicate settlement references, status transitions, released funds, ledger
reconciliation, notification access, and draft product privacy.

## PayFast on Vercel

Keep the existing two `VITE_SUPABASE_*` variables. Add the following server-only
variables in Vercel's Production environment, then redeploy:

| Variable | Value |
| --- | --- |
| `PAYFAST_MODE` | `live` for live credentials, `sandbox` for separate sandbox credentials |
| `PAYFAST_MERCHANT_ID` | Your matching PayFast Merchant ID |
| `PAYFAST_MERCHANT_KEY` | Your matching PayFast Merchant Key |
| `PAYFAST_PASSPHRASE` | The security passphrase configured in the same PayFast account |
| `APP_BASE_URL` | Your canonical public HTTPS origin, without a trailing path |
| `SUPABASE_SERVICE_ROLE_KEY` | This Supabase project's server secret or legacy service-role key |
| `SUPABASE_URL` | Optional if `VITE_SUPABASE_URL` is already set |

Never prefix the server secret or PayFast passphrase with `VITE_`. Merchant
credentials supplied in chat are saved only in the ignored local `.env.local`;
GitHub intentionally contains no account-specific payment credentials.

`SUPABASE_SECRET_KEY` is also accepted as the server secret variable name. Use
either that name or `SUPABASE_SERVICE_ROLE_KEY`; a publishable key cannot replace
the server secret. Missing settings are identified explicitly by the payment API.

The registered notification URL is `https://<your-domain>/api/payfast/notify`.
It must be publicly accessible to PayFast: do not put deployment authentication,
CAPTCHA, or a blocking firewall in front of this callback. The callback checks the
merchant, signature, PayFast source address, exact order amount, payment mode and
PayFast's server confirmation before recording a COMPLETE payment. It returns
an error on temporary settlement failure so PayFast can retry. Repeated valid
notifications credit an order only once.

`vercel.json` preserves `/api/*` for server functions and rewrites other routes
to the React application. Plain `npm run dev` serves only Vite; payment functions
require Vercel deployment or Vercel's local development server.

The installed database addition is
`supabase/migrations/20261126123255_payfast_orders.sql`.
Validate without making live payments:

```text
node --test scripts/test-payfast.mjs
node scripts/wallet-db.mjs scripts/test-payfast-orders.sql
```

After all variables are saved and the deployment is ready, sign in with a verified
customer account and use Buy to open PayFast. The customer must complete any live
payment themselves. A successful browser redirect initially displays pending
confirmation, then updates holdings after the independently confirmed notification.
