import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { result } from "@/lib/wallet-api";

export function useWalletNotifications(audience) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["wallet-notifications", audience, user?.id];
  const query = useQuery({
    queryKey,
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      const notices = await result(
        supabase
          .from("wallet_notifications")
          .select("*")
          .eq("audience", audience)
          .order("created_at", { ascending: false })
          .limit(100),
      );
      const reads = notices.length
        ? await result(
            supabase
              .from("wallet_notification_reads")
              .select("notification_id")
              .eq("user_id", user.id)
              .in(
                "notification_id",
                notices.map((n) => n.id),
              ),
          )
        : [];
      const seen = new Set(reads.map((r) => r.notification_id));
      return notices.map((n) => ({ ...n, read: seen.has(n.id) }));
    },
  });
  const markRead = async (notifications) => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length)
      await result(
        supabase.from("wallet_notification_reads").upsert(
          unread.map((n) => ({ notification_id: n.id, user_id: user.id })),
          { onConflict: "notification_id,user_id", ignoreDuplicates: true },
        ),
      );
    await queryClient.invalidateQueries({ queryKey });
  };
  return {
    ...query,
    notices: query.data ?? [],
    unread: (query.data ?? []).filter((n) => !n.read).length,
    markRead,
  };
}
