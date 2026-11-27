import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchSpotPrices,
  GRAMS_PER_TROY_OUNCE,
} from "../server/spot-prices.mjs";
const mock = (values) => async (url) => ({
  ok: values[url] !== undefined,
  json: async () => values[url],
});
const gold = "https://api.gold-api.com/price/XAU";
const wise = "https://wise.com/rates/live?source=USD&target=ZAR";
const frankfurter =
  "https://api.frankfurter.dev/v1/latest?base=USD&symbols=ZAR";
test("converts USD per troy ounce to rand per ounce and gram without rounding early", async () => {
  const prices = await fetchSpotPrices(
    mock({ [gold]: { price: 3000.12 }, [wise]: { value: 18.1234 } }),
  );
  assert.equal(prices.priceZAR, 3000.12 * 18.1234);
  assert.equal(prices.pricePerGramZAR, prices.priceZAR / GRAMS_PER_TROY_OUNCE);
  assert.equal(prices.usdZar.source, "Wise");
});
test("falls back to Frankfurter when Wise returns invalid data", async () => {
  const prices = await fetchSpotPrices(
    mock({
      [gold]: { price: 3000 },
      [wise]: { value: 0 },
      [frankfurter]: { rates: { ZAR: 18 }, date: "2026-11-26" },
    }),
  );
  assert.equal(prices.priceZAR, 54000);
  assert.equal(prices.usdZar.source, "Frankfurter");
  assert.equal(prices.usdZar.rateDate, "2026-11-26");
});
test("rejects unavailable or invalid metal and FX feeds", async () => {
  for (const values of [
    {},
    { [gold]: { price: -1 }, [wise]: { value: 18 } },
    { [gold]: { price: 3000 } },
  ]) {
    await assert.rejects(
      fetchSpotPrices(mock(values)),
      /temporarily unavailable/,
    );
  }
});
