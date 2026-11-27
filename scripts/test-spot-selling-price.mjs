import test from "node:test";
import assert from "node:assert/strict";
import { spotSellingPrice } from "../src/lib/spot-selling-price.mjs";

test("prices fine gold weight and rounds only the final rand amount", () => {
  assert.equal(spotSellingPrice(63736.406628, "1"), "63736.41");
  assert.equal(spotSellingPrice(63736.406628, "0.25"), "15934.10");
  assert.equal(spotSellingPrice(63736.406628, "0.1"), "6373.64");
});
test("rejects missing weights, invalid feeds, and out of range amounts", () => {
  for (const [spot, weight] of [
    [0, 1],
    [NaN, 1],
    [100, ""],
    [100, -1],
    [Infinity, 1],
    [100, "bad"],
    [100000001, 1],
    [0.01, 0.001],
  ]) {
    assert.throws(() => spotSellingPrice(spot, weight));
  }
});
