import { fetchSpotPrices } from "../server/spot-prices.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const prices = await fetchSpotPrices();
    res.setHeader("Cache-Control", "public, s-maxage=60, must-revalidate");
    return res.status(200).json(prices);
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({ error: error.message });
  }
}
