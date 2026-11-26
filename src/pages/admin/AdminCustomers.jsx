import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { rpc, money, toCents, dateTime } from "@/lib/wallet-api";
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

function Credit({ customer, onClose, onSaved }) {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const saving = useRef(false);
  const save = async (e) => {
    e.preventDefault();
    if (saving.current || !confirmed) return;
    saving.current = true;
    setBusy(true);
    setError(null);
    try {
      await rpc("record_settled_credit", {
        p_user: customer.user_id,
        p_amount: toCents(amount),
        p_reference: reference,
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
        <DialogTitle className="sr-only">Record settled cash</DialogTitle>
        <DialogDescription className="sr-only">
          Record cash already received and reconciled for this customer.
        </DialogDescription>
        <div className="admin-modal-heading">
          <h2>Record settled cash</h2>
        </div>
        <p className="admin-description" style={{ marginBottom: 20 }}>
          {customer.email}
        </p>
        <ErrorMessage error={error} />
        <div className="admin-notice">
          Only record money already received and reconciled, such as proceeds of
          a completed gold sale. This creates withdrawable cash. It does not
          collect a payment or sell gold.
        </div>
        <form onSubmit={save} className="space-y-5">
          <Field label="Amount (ZAR)">
            <input
              type="number"
              required
              min="0.01"
              max="1000000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Unique bank or sale settlement reference">
            <input
              required
              minLength={3}
              maxLength={160}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </Field>
          <label className="admin-check">
            <input
              required
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I have verified these funds have settled and have not already been
            credited.
          </label>
          <footer>
            <button
              className="admin-button"
              type="button"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="admin-button primary"
              disabled={busy || !confirmed}
            >
              {busy ? "Recording…" : "Record settled cash"}
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCustomers() {
  const client = useQueryClient();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [success, setSuccess] = useState(false);
  const query = useQuery({
    queryKey: ["admin-customers", search, page],
    queryFn: () =>
      rpc("admin_customers", { p_search: search, p_offset: page * 50 }),
  });
  return (
    <>
      <PageHeader
        title="Customers"
        description="Identity status and settled cash balances for your customers."
      />
      <ErrorMessage error={query.error} />
      {success && (
        <p className="admin-success" role="status">
          Settled funds recorded in the customer’s cash ledger.
        </p>
      )}
      <form
        className="admin-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(input.trim());
          setPage(0);
        }}
      >
        <input
          className="admin-search"
          aria-label="Search customers"
          placeholder="Search email or customer ID…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="admin-button">Search</button>
      </form>
      {query.isPending ? (
        <Loading />
      ) : query.data?.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>IDENTITY</th>
                <th>AVAILABLE CASH</th>
                <th>RESERVED</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((c) => (
                <tr key={c.user_id}>
                  <td>
                    {c.email}
                    <small>{c.user_id}</small>
                    <small>Joined {dateTime(c.created_at)}</small>
                  </td>
                  <td>
                    <Status value={c.verification} />
                  </td>
                  <td className="amount">{money(c.available_cents)}</td>
                  <td className="amount">{money(c.reserved_cents)}</td>
                  <td>
                    <button
                      className="admin-button"
                      onClick={() => {
                        setSelected(c);
                        setSuccess(false);
                      }}
                    >
                      Record settled cash
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !query.error && <Empty>No customers match this search.</Empty>
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
          disabled={!query.data || query.data.length < 50}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
      {selected && (
        <Credit
          customer={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            ["admin-customers", "admin-stats", "cash-account"].forEach((key) =>
              client.invalidateQueries({ queryKey: [key] }),
            );
            setSuccess(true);
          }}
        />
      )}
    </>
  );
}
