import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, RefreshCw } from "lucide-react";
import { useWalletNotifications } from "@/hooks/useWalletNotifications";
import { dateTime } from "@/lib/wallet-api";
import {
  PageHeader,
  ErrorMessage,
  Loading,
  Empty,
} from "@/components/admin/AdminUI";

export default function AdminNotifications() {
  const { notices, unread, markRead, error, isPending, refetch } =
    useWalletNotifications("admin");
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);
  const read = async (records) => {
    setBusy(true);
    setActionError(null);
    try {
      await markRead(records);
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        title="Notifications"
        description="New customer withdrawal requests arrive here. Refreshes every 15 seconds."
      >
        <button className="admin-button" onClick={() => refetch()}>
          <RefreshCw size={16} />
          Refresh
        </button>
        <button
          className="admin-button primary"
          disabled={!unread || busy}
          onClick={() => read(notices)}
        >
          <CheckCheck size={17} />
          Mark all read
        </button>
      </PageHeader>
      <ErrorMessage error={error || actionError} />
      <section className="admin-panel">
        {isPending ? (
          <Loading />
        ) : notices.length ? (
          notices.map((n) => (
            <article
              key={n.id}
              className={`admin-notification ${n.read ? "" : "unread"}`}
            >
              <div>
                <h3>
                  {n.title}
                  {!n.read && (
                    <span
                      className="admin-status status-requested"
                      style={{ marginLeft: 10 }}
                    >
                      New
                    </span>
                  )}
                </h3>
                <p>{n.body}</p>
                <time>{dateTime(n.created_at)}</time>
              </div>
              <div className="admin-actions">
                {n.withdrawal_id && (
                  <Link
                    to={`/admin/withdrawals?request=${n.withdrawal_id}`}
                    className="admin-button"
                    onClick={() => {
                      read([n]);
                    }}
                  >
                    View request
                  </Link>
                )}
                {!n.read && (
                  <button
                    disabled={busy}
                    className="admin-button"
                    onClick={() => read([n])}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          !error && <Empty>No withdrawal notifications yet.</Empty>
        )}
      </section>
      <p className="admin-refresh-status">
        Showing the latest 100 alerts. Read status is saved separately for each
        admin.
      </p>
    </>
  );
}
