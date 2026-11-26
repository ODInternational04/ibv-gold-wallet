import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import {
  loadWithdrawals,
  rpc,
  result,
  money,
  dateTime,
} from "@/lib/wallet-api";
import {
  PageHeader,
  ErrorMessage,
  Loading,
  Empty,
  Status,
  Field,
} from "@/components/admin/AdminUI";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const transitions = {
  requested: ["approved", "rejected"],
  approved: ["processing", "rejected"],
  processing: ["paid", "failed"],
};
function Review({ request, onClose, onSaved }) {
  const [status, setStatus] = useState(transitions[request.status]?.[0] ?? "");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const save = async (e) => {
    e.preventDefault();
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError(null);
    try {
      await rpc("review_withdrawal", {
        p_id: request.id,
        p_status: status,
        p_notes: notes,
        p_reference: reference || null,
        p_confirmed: confirmed,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
      saving.current = false;
    }
  };
  const needsConfirmation = ["approved", "paid", "failed"].includes(status);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="admin-shell admin-modal"
        style={{ display: "block" }}
        onEscapeKeyDown={(e) => busy && e.preventDefault()}
        onInteractOutside={(e) => busy && e.preventDefault()}
      >
        <DialogTitle className="sr-only">Review withdrawal request</DialogTitle>
        <DialogDescription className="sr-only">
          Check the customer bank details and update this withdrawal.
        </DialogDescription>
        <div className="admin-modal-heading">
          <h2>Withdrawal {money(request.amount_cents)}</h2>
          <Status value={request.status} />
        </div>
        <ErrorMessage error={error} />
        <dl className="admin-detail-grid">
          {[
            ["Account holder", request.account_holder],
            ["Bank", request.bank_name],
            ["Account number", request.account_number],
            ["Branch code", request.branch_code],
            ["Account type", request.account_type],
            ["Customer ID", request.user_id],
            ["Requested", dateTime(request.created_at)],
            ["Request reference", request.id],
            ...(request.payment_reference
              ? [["Bank payment reference", request.payment_reference]]
              : []),
            ...(request.reviewer_notes
              ? [["Last review notes", request.reviewer_notes]]
              : []),
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {transitions[request.status] ? (
          <form onSubmit={save} className="space-y-5">
            <div className="admin-notice">
              Funds are reserved. Make bank transfers outside this portal. Mark
              a request paid only after the bank confirms the transfer. Never
              release funds for a transfer with an unknown outcome.
            </div>
            <Field label="Next status">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setConfirmed(false);
                }}
              >
                {transitions[request.status].map((s) => (
                  <option key={s} value={s}>
                    {
                      {
                        approved: "Approve request",
                        rejected: "Reject and release funds",
                        processing: "Mark transfer in progress",
                        paid: "Confirm paid",
                        failed:
                          "Confirm bank transfer failed and release funds",
                      }[s]
                    }
                  </option>
                ))}
              </select>
            </Field>
            {status === "paid" && (
              <Field label="Bank payment reference">
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </Field>
            )}
            <Field
              label={`Review notes${["rejected", "failed"].includes(status) ? " (required)" : ""}`}
            >
              <textarea
                rows={3}
                required={["rejected", "failed"].includes(status)}
                minLength={
                  ["rejected", "failed"].includes(status) ? 5 : undefined
                }
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
            {needsConfirmation && (
              <label className="admin-check">
                <input
                  type="checkbox"
                  required
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                {status === "approved"
                  ? "I have verified this bank account belongs to the verified customer."
                  : status === "paid"
                    ? "The bank has confirmed this payment succeeded."
                    : "The bank has definitively confirmed the transfer failed and no payment will settle."}
              </label>
            )}
            <footer>
              <button
                type="button"
                disabled={busy}
                className="admin-button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className={`admin-button ${["rejected", "failed"].includes(status) ? "danger" : "primary"}`}
              >
                {busy ? "Updating…" : "Update request"}
              </button>
            </footer>
          </form>
        ) : (
          <footer>
            <button className="admin-button" onClick={onClose}>
              Close
            </button>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminWithdrawals() {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [success, setSuccess] = useState(false);
  const requestId = params.get("request");
  const query = useQuery({
    queryKey: ["admin-withdrawals", status, page],
    queryFn: () => loadWithdrawals({ status, page }),
    refetchInterval: 15000,
  });
  const selected = useQuery({
    queryKey: ["withdrawal", requestId],
    queryFn: () =>
      result(
        supabase
          .from("withdrawal_requests")
          .select("*")
          .eq("id", requestId)
          .single(),
      ),
    enabled: !!requestId,
  });
  return (
    <>
      <PageHeader
        title="Withdrawals"
        description="Review bank details, manage requests and record payment confirmations."
      >
        <button
          className="admin-button"
          disabled={query.isFetching}
          onClick={() => query.refetch()}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </PageHeader>
      <ErrorMessage error={query.error || selected.error} />
      {success && (
        <p className="admin-success" role="status">
          Withdrawal updated. The customer has been notified in their wallet.
        </p>
      )}
      <div className="admin-toolbar">
        <select
          aria-label="Filter withdrawal status"
          style={{ maxWidth: 240 }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          {[
            "all",
            "requested",
            "approved",
            "processing",
            "paid",
            "rejected",
            "failed",
          ].map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <span className="admin-card-note">Manual bank settlement</span>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.data?.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>CUSTOMER / REQUEST</th>
                <th>AMOUNT</th>
                <th>BANK</th>
                <th>STATUS</th>
                <th>SUBMITTED</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.account_holder}
                    <small>#{r.id.slice(0, 8)}</small>
                  </td>
                  <td className="amount">{money(r.amount_cents)}</td>
                  <td>
                    {r.bank_name}
                    <small>Account ending {r.account_number.slice(-4)}</small>
                  </td>
                  <td>
                    <Status value={r.status} />
                  </td>
                  <td>{dateTime(r.created_at)}</td>
                  <td>
                    <button
                      className="admin-button"
                      onClick={() => {
                        setParams({ request: r.id });
                        setSuccess(false);
                      }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !query.error && <Empty>No withdrawal requests in this view.</Empty>
      )}
      <div className="admin-pagination">
        <button
          className="admin-button"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button
          className="admin-button"
          disabled={!query.data || query.data.length < 25}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
      {requestId && selected.isPending && <Loading />}
      {requestId && selected.data && (
        <Review
          key={selected.data.id}
          request={selected.data}
          onClose={() => setParams({})}
          onSaved={() => {
            [
              "admin-withdrawals",
              "admin-stats",
              "admin-recent-withdrawals",
              "withdrawal",
              "admin-customers",
              "cash-account",
            ].forEach((key) => client.invalidateQueries({ queryKey: [key] }));
            setSuccess(true);
          }}
        />
      )}
    </>
  );
}
