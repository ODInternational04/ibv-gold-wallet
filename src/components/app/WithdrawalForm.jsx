import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useVerification } from "@/hooks/useVerification";
import { supabase } from "@/utils/supabase/client";
import {
  result,
  rpc,
  money,
  toCents,
  dateTime,
  loadWithdrawals,
} from "@/lib/wallet-api";
import "./withdrawal.css";

export default function WithdrawalForm() {
  const { user } = useAuth();
  const { isVerified, loading: verificationLoading } = useVerification();
  const client = useQueryClient();
  const account = useQuery({
    queryKey: ["cash-account", user?.id],
    enabled: !!user,
    queryFn: () =>
      result(
        supabase
          .from("cash_accounts")
          .select("available_cents,reserved_cents")
          .eq("user_id", user.id)
          .maybeSingle(),
      ),
    refetchInterval: 15000,
  });
  const [page, setPage] = useState(0);
  const requests = useQuery({
    queryKey: ["my-withdrawals", user?.id, page],
    enabled: !!user,
    queryFn: () => loadWithdrawals({ userId: user.id, page }),
    refetchInterval: 15000,
  });
  const [form, setForm] = useState({
    amount: "",
    holder: "",
    bank: "",
    account: "",
    branch: "",
    type: "current",
    confirmed: false,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);
  const requestKey = useRef(crypto.randomUUID());
  const sending = useRef(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const submit = async (e) => {
    e.preventDefault();
    if (sending.current || !form.confirmed) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const amount = toCents(form.amount);
      if (amount > Number(account.data?.available_cents ?? 0))
        throw new Error("The amount exceeds your available settled cash.");
      const id = await rpc("request_withdrawal", {
        p_key: requestKey.current,
        p_amount: amount,
        p_holder: form.holder,
        p_bank: form.bank,
        p_account: form.account,
        p_branch: form.branch,
        p_type: form.type,
      });
      requestKey.current = crypto.randomUUID();
      setSuccess(id);
      setForm((f) => ({ ...f, amount: "", confirmed: false }));
      [
        "cash-account",
        "my-withdrawals",
        "wallet-notifications",
        "admin-stats",
      ].forEach((key) => client.invalidateQueries({ queryKey: [key] }));
    } catch (err) {
      setError(err);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };
  const available = Number(account.data?.available_cents ?? 0);
  const blocked =
    !isVerified ||
    verificationLoading ||
    account.isPending ||
    !!account.error ||
    available <= 0;
  return (
    <div className="withdrawal-area">
      <section className="withdrawal-card">
        <div className="withdrawal-heading">
          <div>
            <p className="withdrawal-eyebrow">BANK WITHDRAWAL</p>
            <h3>Withdraw settled cash</h3>
            <p>Request a transfer to your own South African bank account.</p>
          </div>
          <div className="withdrawal-balances">
            <span>
              Available cash
              <strong>
                {account.isPending
                  ? "Loading…"
                  : account.error
                    ? "Unavailable"
                    : money(available)}
              </strong>
            </span>
            <span>
              Pending withdrawals
              <strong>
                {account.isPending
                  ? "…"
                  : account.error
                    ? "Unavailable"
                    : money(account.data?.reserved_cents)}
              </strong>
            </span>
          </div>
        </div>
        {(error || account.error) && (
          <p className="withdrawal-error" role="alert">
            {(error || account.error).message}
          </p>
        )}
        {success && (
          <p className="withdrawal-success" role="status">
            Withdrawal requested. Reference #{success.slice(0, 8)}. Your funds
            are reserved while our team reviews the request.
          </p>
        )}
        {!verificationLoading && !isVerified && (
          <p className="withdrawal-info">
            Complete <Link to="/registration">identity verification</Link>{" "}
            before requesting a withdrawal.
          </p>
        )}
        {!account.isPending && !account.error && available === 0 && (
          <p className="withdrawal-info">
            You have no settled cash available. Gold holdings must be sold and
            the proceeds settled before they can be withdrawn. Contact our team
            to arrange a sale.
          </p>
        )}
        <form onSubmit={submit}>
          <fieldset disabled={busy || blocked} className="withdrawal-fields">
            <label>
              Amount (ZAR)
              <input
                required
                type="number"
                min="0.01"
                max={Math.min(available / 100, 1000000)}
                step="0.01"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
            </label>
            <label>
              Account holder
              <input
                required
                minLength={2}
                maxLength={160}
                autoComplete="name"
                value={form.holder}
                onChange={(e) => set("holder", e.target.value)}
              />
            </label>
            <label>
              Bank name
              <input
                required
                minLength={2}
                maxLength={100}
                value={form.bank}
                onChange={(e) => set("bank", e.target.value)}
              />
            </label>
            <label>
              Account number
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6,20}"
                minLength={6}
                maxLength={20}
                value={form.account}
                onChange={(e) =>
                  set("account", e.target.value.replace(/\D/g, ""))
                }
              />
            </label>
            <label>
              Branch code
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={form.branch}
                onChange={(e) =>
                  set("branch", e.target.value.replace(/\D/g, ""))
                }
              />
            </label>
            <label>
              Account type
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="current">Current / cheque</option>
                <option value="savings">Savings</option>
                <option value="transmission">Transmission</option>
              </select>
            </label>
            <label className="withdrawal-confirm">
              <input
                type="checkbox"
                required
                checked={form.confirmed}
                onChange={(e) => set("confirmed", e.target.checked)}
              />
              I confirm this bank account belongs to me and the details are
              correct.
            </label>
            <div className="withdrawal-submit">
              <p>
                No withdrawal fee is charged by this wallet. Our team checks
                your bank details before making the transfer.
              </p>
              <button disabled={busy || blocked || !form.confirmed}>
                {busy ? "Submitting…" : "Request withdrawal"}
              </button>
            </div>
          </fieldset>
        </form>
      </section>
      <section className="withdrawal-card">
        <h3>Your withdrawal requests</h3>
        {requests.error && (
          <p role="alert" className="withdrawal-error">
            {requests.error.message}
          </p>
        )}
        {requests.isPending ? (
          <p className="withdrawal-muted">Loading requests…</p>
        ) : requests.data?.length ? (
          <div className="withdrawal-history">
            {requests.data.map((r) => (
              <article key={r.id}>
                <div>
                  <strong>{money(r.amount_cents)}</strong>
                  <p>
                    {r.bank_name} · ending {r.account_number.slice(-4)}
                  </p>
                  <small>
                    {dateTime(r.created_at)} · #{r.id.slice(0, 8)}
                  </small>
                  {r.payment_reference && (
                    <p>Payment reference: {r.payment_reference}</p>
                  )}
                  {["rejected", "failed"].includes(r.status) &&
                    r.reviewer_notes && <p>{r.reviewer_notes}</p>}
                </div>
                <span
                  className={`withdrawal-state withdrawal-state-${r.status}`}
                >
                  {r.status}
                </span>
              </article>
            ))}
          </div>
        ) : (
          !requests.error && (
            <p className="withdrawal-muted">
              You haven’t requested a withdrawal yet.
            </p>
          )
        )}
        <div className="withdrawal-pagination">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {page + 1}</span>
          <button
            disabled={!requests.data || requests.data.length < 25}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
