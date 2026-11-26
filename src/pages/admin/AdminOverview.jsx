import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, Package, Landmark, Wallet, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { rpc, money, dateTime, loadWithdrawals } from "@/lib/wallet-api";
import {
  PageHeader,
  ErrorMessage,
  Loading,
  Empty,
  Status,
} from "@/components/admin/AdminUI";

export default function AdminOverview() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => rpc("admin_stats"),
    refetchInterval: 15000,
  });
  const requests = useQuery({
    queryKey: ["admin-recent-withdrawals"],
    queryFn: () => loadWithdrawals(),
    refetchInterval: 15000,
  });
  const data = stats.data;
  return (
    <>
      <PageHeader
        title="Business overview"
        description="Customers, catalog activity and withdrawal operations."
      >
        <button
          className="admin-button"
          onClick={() => {
            stats.refetch();
            requests.refetch();
          }}
          disabled={stats.isFetching}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
        <Link className="admin-button primary" to="/admin/products">
          Manage products
        </Link>
      </PageHeader>
      <ErrorMessage error={stats.error || requests.error} />
      {stats.isPending ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="admin-grid">
              {[
                {
                  label: "Customers",
                  value: data.customers,
                  note: `${data.verified} identity verified`,
                  Icon: Users,
                },
                {
                  label: "Active products",
                  value: data.active_products,
                  note: "Visible in the customer catalog",
                  Icon: Package,
                },
                {
                  label: "Open withdrawals",
                  value: data.pending_withdrawals,
                  note: `${money(data.pending_cents)} awaiting settlement`,
                  Icon: Landmark,
                },
                {
                  label: "Withdrawals paid",
                  value: money(data.paid_cents),
                  note: "Confirmed manual bank transfers",
                  Icon: Wallet,
                },
              ].map(({ label, value, note, Icon }) => (
                <div className="admin-card" key={label}>
                  <div className="admin-card-label">
                    {label}
                    <Icon size={19} color="#92702b" />
                  </div>
                  <p className="admin-card-value">{value}</p>
                  <p className="admin-card-note">{note}</p>
                </div>
              ))}
            </div>
            <div className="admin-panels">
              <section className="admin-panel">
                <div className="admin-panel-header">
                  <h2>Withdrawal requests</h2>
                  <span className="admin-card-note">Last 7 days · SAST</span>
                </div>
                <p className="secondary">Requests submitted each day</p>
                <div className="admin-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weekly_requests}>
                      <XAxis
                        dataKey="day"
                        tickFormatter={(d) => d.slice(5)}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#645f57", fontSize: 14 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#645f57", fontSize: 14 }}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #dedbd4",
                          borderRadius: 8,
                        }}
                        labelStyle={{ color: "#39352f" }}
                      />
                      <Bar
                        dataKey="requests"
                        name="Requests"
                        fill="#92702b"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={42}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className="admin-panel">
                <div className="admin-panel-header">
                  <h2>Cash & review queue</h2>
                  <Link to="/admin/customers">View customers</Link>
                </div>
                <dl className="admin-detail-grid">
                  <div>
                    <dt>Settled cash recorded</dt>
                    <dd>{money(data.settled_cents)}</dd>
                  </div>
                  <div>
                    <dt>Available customer cash</dt>
                    <dd>{money(data.available_cents)}</dd>
                  </div>
                  <div>
                    <dt>Reserved for withdrawals</dt>
                    <dd>{money(data.reserved_cents)}</dd>
                  </div>
                  <div>
                    <dt>Identity checks pending</dt>
                    <dd>{data.verification_pending}</dd>
                  </div>
                </dl>
                <p className="secondary">
                  Cash figures come from the settlement ledger. Gold holdings
                  and sandbox checkout returns do not count as withdrawable
                  cash.
                </p>
                <Link
                  to="/admin/verifications"
                  className="admin-button"
                  style={{ marginTop: 22 }}
                >
                  Review identity documents
                </Link>
              </section>
            </div>
          </>
        )
      )}
      <section style={{ marginTop: 30 }}>
        <div className="admin-panel-header">
          <h2>Latest withdrawal requests</h2>
          <Link to="/admin/withdrawals">View all requests</Link>
        </div>
        {requests.isPending ? (
          <Loading />
        ) : requests.data?.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>REQUEST</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>SUBMITTED</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.data.slice(0, 5).map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.account_holder}
                      <small>#{r.id.slice(0, 8)}</small>
                    </td>
                    <td className="amount">{money(r.amount_cents)}</td>
                    <td>
                      <Status value={r.status} />
                    </td>
                    <td>{dateTime(r.created_at)}</td>
                    <td>
                      <Link
                        className="admin-button"
                        to={`/admin/withdrawals?request=${r.id}`}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !requests.error && (
            <div className="admin-panel">
              <Empty>No withdrawal requests yet.</Empty>
            </div>
          )
        )}
      </section>
      <p className="admin-refresh-status">
        Updates every 15 seconds while this portal is open.
      </p>
    </>
  );
}
