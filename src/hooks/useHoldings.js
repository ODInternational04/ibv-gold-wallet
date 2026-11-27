import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/lib/AuthContext";

async function fetchHoldings(userId) {
  const { data, error } = await supabase
    .from("transactions")
    .select("oz_amount, product_name, purchase_price_zar, created_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function useHoldings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["holdings", user?.id],
    queryFn: () => fetchHoldings(user.id),
    enabled: !!user,
    staleTime: 1000 * 30,
    refetchInterval: 15000,
  });

  const totalOz = transactions.reduce((sum, t) => sum + Number(t.oz_amount), 0);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["holdings", user?.id] });

  return { transactions, totalOz, isLoading, invalidate };
}
