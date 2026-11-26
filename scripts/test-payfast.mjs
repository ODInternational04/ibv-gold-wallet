import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  phpEncode,
  parameterString,
  signature,
  verifySignature,
  cents,
  config,
  checkoutFields,
  readBody,
  validSource,
} from "../server/payfast.mjs";
import checkoutHandler from "../api/payfast/checkout.js";
import notifyHandler from "../api/payfast/notify.js";
import { databaseConfig } from '../server/supabase.mjs';

test('database configuration identifies missing settings without revealing values',()=>{
  assert.throws(()=>databaseConfig({}),/SUPABASE_URL/);
  const env={VITE_SUPABASE_URL:'https://project.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture'};
  assert.throws(()=>databaseConfig(env,true),/SUPABASE_SERVICE_ROLE_KEY/);
  assert.equal(databaseConfig({...env,SUPABASE_SECRET_KEY:' sb_secret_fixture '},true).key,'sb_secret_fixture');
  assert.equal(databaseConfig({...env,SUPABASE_SERVICE_ROLE_KEY:' ',SUPABASE_SECRET_KEY:'sb_secret_fixture'},true).key,'sb_secret_fixture');
  assert.throws(()=>databaseConfig({...env,SUPABASE_SERVICE_ROLE_KEY:'sb_publishable_fixture'},true),/publishable key/);
});

const settings = {
  mode: "live",
  merchantId: "12345678",
  merchantKey: "fixture-key",
  passphrase: "fixture-passphrase",
  site: "https://wallet.example",
  host: "www.payfast.co.za",
};
test("PHP form encoding matches PayFast conventions", () =>
  assert.equal(phpEncode("Gold + ~!*'()"), "Gold+%2B+%7E%21%2A%27%28%29"));
test("checkout signs ordered fields with passphrase and excludes blank checkout fields", () => {
  const fields = {
    merchant_id: "12345678",
    item_name: " Gold coin ",
    optional: "",
  };
  const expected = createHash("md5")
    .update(
      "merchant_id=12345678&item_name=Gold+coin&passphrase=fixture-passphrase",
    )
    .digest("hex");
  assert.equal(signature(fields, settings.passphrase, true), expected);
});
test("notification signature includes all fields, including empty values", () => {
  const fields = {
    merchant_id: "12345678",
    m_payment_id: "order",
    empty: "",
    amount_gross: "100.00",
  };
  fields.signature = signature(fields, settings.passphrase);
  assert(verifySignature(fields, settings.passphrase));
  assert.equal(
    parameterString(fields),
    "merchant_id=12345678&m_payment_id=order&empty=&amount_gross=100.00",
  );
  assert(
    !verifySignature({ ...fields, amount_gross: "1.00" }, settings.passphrase),
  );
  assert(!verifySignature(fields, "wrong-passphrase"));
});
test("checkout has public callback URLs, a server order ID and exact cents", () => {
  const fields = checkoutFields(
    settings,
    { id: "server-order", amount_cents: 940001, product_name: "Gold coin" },
    "buyer@example.invalid",
  );
  assert.equal(fields.amount, "9400.01");
  assert.equal(fields.m_payment_id, "server-order");
  assert.equal(fields.notify_url, "https://wallet.example/api/payfast/notify");
  assert(!Object.values(fields).includes(settings.passphrase));
});
test("invalid amounts are rejected without floating point tolerance", () => {
  assert.equal(cents("0.01"), 1);
  assert.equal(cents("9400.01"), 940001);
  for (const value of ["-1.00", "0.00", "1e2", "1.001", "1", "NaN"])
    assert.throws(() => cents(value));
});
test("missing passphrase or HTTP callback prevents live checkout", () => {
  const env = {
    PAYFAST_MERCHANT_ID: "12345678",
    PAYFAST_MERCHANT_KEY: "fixture",
    PAYFAST_PASSPHRASE: "fixture",
    APP_BASE_URL: "https://wallet.example",
    PAYFAST_MODE: "live",
  };
  assert.equal(config(env).mode, "live");
  assert.throws(() => config({ ...env, PAYFAST_PASSPHRASE: "" }));
  assert.throws(() =>
    config({ ...env, APP_BASE_URL: "http://localhost:5173" }),
  );
  assert.throws(() => config({ ...env, PAYFAST_MODE: "unknown" }));
  assert.throws(() => config({ ...env, PAYFAST_MERCHANT_ID: "10000100" }));
});
test("duplicate or non-scalar webhook fields are rejected", async () => {
  await assert.rejects(() =>
    readBody(
      { headers: {}, body: "amount_gross=1.00&amount_gross=2.00" },
      true,
    ),
  );
  await assert.rejects(() =>
    readBody({ headers: {}, body: { amount_gross: ["1.00", "2.00"] } }, true),
  );
});
test("notification source must match PayFast DNS, not spoofable headers", async () => {
  const resolver = async () => [{ address: "203.0.113.8" }];
  assert(
    await validSource(
      { headers: {}, socket: { remoteAddress: "203.0.113.8" } },
      settings,
      resolver,
    ),
  );
  assert(
    !(await validSource(
      {
        headers: { "x-forwarded-for": "203.0.113.8" },
        socket: { remoteAddress: "203.0.113.9" },
      },
      settings,
      resolver,
    )),
  );
});
test("API handlers reject unsigned requests and never credit from browser redirects", async () => {
  const names = [
    "PAYFAST_MERCHANT_ID",
    "PAYFAST_MERCHANT_KEY",
    "PAYFAST_PASSPHRASE",
    "APP_BASE_URL",
    "PAYFAST_MODE",
  ];
  const previous = Object.fromEntries(
    names.map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, {
    PAYFAST_MERCHANT_ID: "12345678",
    PAYFAST_MERCHANT_KEY: "fixture",
    PAYFAST_PASSPHRASE: "fixture",
    APP_BASE_URL: "https://wallet.example",
    PAYFAST_MODE: "live",
  });
  const response = () => ({
    code: 0,
    payload: null,
    setHeader() {},
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
    send(body) {
      this.payload = body;
      return this;
    },
  });
  try {
    let res = response();
    await checkoutHandler({ method: "POST", headers: {}, body: {} }, res);
    assert.equal(res.code, 401);
    res = response();
    await checkoutHandler({ method: "GET", headers: {} }, res);
    assert.equal(res.code, 405);
    res = response();
    await notifyHandler({ method: "GET", headers: {} }, res);
    assert.equal(res.code, 405);
    res = response();
    await notifyHandler(
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: {
          merchant_id: "12345678",
          signature: "forged",
          payment_status: "COMPLETE",
        },
      },
      res,
    );
    assert.equal(res.code, 403);
  } finally {
    for (const key of names) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
