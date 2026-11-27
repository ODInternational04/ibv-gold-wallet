export const GRAMS_PER_TROY_OUNCE = 31.1034768;
const positive = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;

export async function fetchSpotPrices(fetcher = fetch) {
  const read = async (url) => {
    try {
      const response = await fetcher(url, {
        signal: AbortSignal.timeout(8000),
      });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  };
  const fx = async () => {
    const wise = await read(
      "https://wise.com/rates/live?source=USD&target=ZAR",
    );
    if (positive(wise?.value)) return { rate: wise.value, source: "Wise" };
    const fallback = await read(
      "https://api.frankfurter.dev/v1/latest?base=USD&symbols=ZAR",
    );
    if (positive(fallback?.rates?.ZAR))
      return {
        rate: fallback.rates.ZAR,
        source: "Frankfurter",
        rateDate: fallback.date ?? null,
      };
    return null;
  };
  const [gold, usdZar] = await Promise.all([
    read("https://api.gold-api.com/price/XAU"),
    fx(),
  ]);
  if (!positive(gold?.price) || !usdZar)
    throw new Error(
      "Spot price is temporarily unavailable. Please try again shortly.",
    );
  const priceZAR = gold.price * usdZar.rate;
  return {
    priceZAR,
    pricePerGramZAR: priceZAR / GRAMS_PER_TROY_OUNCE,
    usdPerOz: gold.price,
    usdZar,
    source: "Gold API",
    updatedAt: new Date().toISOString(),
  };
}
