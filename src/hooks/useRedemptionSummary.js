import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { rpc, money } from "@/lib/wallet-api";

export function useRedemptionSummary() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["redemption-summary", user?.id],
    queryFn: () => rpc("redemption_summary"),
    enabled: !!user,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const missingPrices = Number(query.data?.missing_prices ?? 0);
  const totalOz = Number(query.data?.total_oz ?? 0);
  const valueText = query.isPending
    ? "Loading…"
    : query.error
      ? "Unavailable"
      : missingPrices || query.data?.redeemable_cents == null
        ? "Awaiting admin valuation"
        : money(query.data.redeemable_cents);
  const holdingsText = query.isPending
    ? "Loading…"
    : query.error
      ? "Unavailable"
      : `${totalOz.toFixed(3)} oz`;
  return { ...query, valueText, holdingsText, missingPrices, totalOz };
}
