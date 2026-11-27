import { useQuery } from "@tanstack/react-query";

async function fetchGoldPriceZAR() {
  const res = await fetch("/api/prices");
  if (!res.ok) throw new Error("Failed to fetch gold price");
  const data = await res.json();
  if (!(Number.isFinite(data.priceZAR) && data.priceZAR > 0))
    throw new Error("Invalid price data");
  return data;
}

export function useGoldPrice() {
  const query = useQuery({
    queryKey: ["goldPrice"],
    queryFn: fetchGoldPriceZAR,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  return {
    ...query,
    prices: query.data ?? null,
    priceZAR: query.data?.priceZAR ?? null,
  };
}
