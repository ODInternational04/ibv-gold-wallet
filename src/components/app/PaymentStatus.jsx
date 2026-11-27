import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import { result } from "@/lib/wallet-api";

export default function PaymentStatus({ orderId }) {
  const client = useQueryClient();
  const [poll, setPoll] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setPoll(false), 120000);
    return () => clearTimeout(timer);
  }, []);
  const valid =
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      orderId ?? "",
    );
  const query = useQuery({
    queryKey: ["payment-order", orderId],
    enabled: valid,
    queryFn: () =>
      result(
        supabase
          .from("payment_orders")
          .select("status,product_name,oz_amount")
          .eq("id", orderId)
          .single(),
      ),
    refetchInterval: (q) =>
      poll &&
      q.state.data?.status !== "paid" &&
      q.state.data?.status !== "sandbox_paid"
        ? 3000
        : false,
  });
  useEffect(() => {
    if (query.data?.status === "paid") {
      client.invalidateQueries({ queryKey: ["holdings"] });
      client.invalidateQueries({ queryKey: ["redemption-summary"] });
    }
  }, [query.data?.status, client]);
  if (!valid)
    return (
      <p
        role="alert"
        className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-900"
      >
        Checkout returned, but no valid order reference was provided. Check your
        transaction history or contact support before making another payment.
      </p>
    );
  const paid = query.data?.status === "paid";
  const sandbox = query.data?.status === "sandbox_paid";
  return (
    <div
      role="status"
      className={`rounded-xl border p-4 text-base leading-7 ${paid ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}
    >
      <strong className="block">
        {paid
          ? "Payment confirmed"
          : sandbox
            ? "Test payment confirmed"
            : "Awaiting payment confirmation"}
      </strong>
      <p>
        {paid
          ? `${Number(query.data.oz_amount).toFixed(4)} oz of ${query.data.product_name} has been added to your gold holdings.`
          : sandbox
            ? "This was a sandbox payment. No real gold or cash was credited."
            : query.error
              ? "We could not check your payment status. Please check again or contact support before making another payment."
              : "Your checkout has returned. Your holdings will update once PayFast independently confirms the payment."}
      </p>
      {!paid && !sandbox && (
        <button
          className="mt-2 underline underline-offset-4 disabled:opacity-50"
          disabled={query.isFetching}
          onClick={() => query.refetch()}
        >
          {query.isFetching ? "Checking…" : "Check payment status"}
        </button>
      )}
    </div>
  );
}
