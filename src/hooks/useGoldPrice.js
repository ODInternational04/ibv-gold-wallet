import { useQuery } from '@tanstack/react-query';

async function fetchGoldPriceZAR() {
  const res = await fetch('/.netlify/functions/goldprice');
  if (!res.ok) throw new Error('Failed to fetch gold price');
  const data = await res.json();
  if (!data.priceZAR) throw new Error('Invalid price data');
  return data.priceZAR;
}

export function useGoldPrice() {
  const { data: priceZAR, isLoading, isError } = useQuery({
    queryKey: ['goldPrice'],
    queryFn: fetchGoldPriceZAR,
    staleTime: 1000 * 60 * 5,   // cache for 5 minutes
    retry: 2,
  });

  return { priceZAR: priceZAR ?? null, isLoading, isError };
}
