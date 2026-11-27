import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  Coins,
  Search,
  RefreshCw,
  ShoppingBag,
  Scale,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useRedemptionSummary } from "@/hooks/useRedemptionSummary";
import { rpc, money, dateTime } from "@/lib/wallet-api";
import "./my-wallet.css";

const units = (value) =>
  value == null
    ? "Unavailable"
    : Number(value).toLocaleString("en-ZA", { maximumFractionDigits: 6 });
export default function MyWallet() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const redemption = useRedemptionSummary();
  const query = useQuery({
    queryKey: ["wallet-purchases", user?.id, page, search],
    enabled: !!user,
    queryFn: () => rpc("wallet_purchases", { p_page: page, p_search: search }),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const data = query.data;
  const purchases = data?.purchases ?? [];
  const count = Number(data?.match_count ?? 0);
  const clear = () => {
    setInput("");
    setSearch("");
    setPage(0);
  };
  return (
    <div className="my-wallet">
      <header className="wallet-header">
        <div>
          <p className="wallet-eyebrow">
            <Wallet size={16} />
            YOUR GOLD, IN ONE PLACE
          </p>
          <h1>My Wallet</h1>
          <p>
            All your confirmed gold purchases, with a clear view of what you
            own.
          </p>
        </div>
        <div className="wallet-actions">
          <button
            disabled={query.isFetching}
            onClick={() => {
              query.refetch();
              redemption.refetch();
            }}
            className="wallet-button"
          >
            <RefreshCw
              size={17}
              className={query.isFetching ? "animate-spin" : ""}
            />
            Refresh
          </button>
          <Link className="wallet-button primary" to="/app/transact">
            <ShoppingBag size={17} />
            Buy gold
          </Link>
        </div>
      </header>
      <div className="wallet-summary">
        {[
          {
            label: "Gold owned",
            value: query.isPending
              ? "Loading…"
              : query.error
                ? "Unavailable"
                : `${Number(data?.total_oz ?? 0).toFixed(3)} oz`,
            note: `${Number(data?.purchase_count ?? 0)} confirmed purchase${Number(data?.purchase_count ?? 0) === 1 ? "" : "s"}`,
            Icon: Coins,
          },
          {
            label: "Total purchase amount",
            value: query.isPending
              ? "Loading…"
              : query.error
                ? "Unavailable"
                : money(data?.purchase_total_cents),
            note: "Amount paid for your gold",
            Icon: ShoppingBag,
          },
          {
            label: "Current redemption value",
            value: redemption.valueText,
            note: "Using current admin-set product values",
            Icon: Scale,
          },
        ].map(({ label, value, note, Icon }) => (
          <section className="wallet-summary-card" key={label}>
            <div className="wallet-summary-label">
              {label}
              <Icon size={20} />
            </div>
            <p className="wallet-summary-value">{value}</p>
            <p className="wallet-secondary">{note}</p>
          </section>
        ))}
      </div>
      <section className="wallet-purchases">
        <div className="wallet-purchases-heading">
          <div>
            <h2>Purchase history</h2>
            <p>
              Purchase amounts are recorded at checkout. Redemption values
              follow the latest admin prices.
            </p>
          </div>
          <form
            className="wallet-search"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(input.trim());
              setPage(0);
            }}
          >
            <label className="sr-only" htmlFor="wallet-search">
              Search purchases by product or SKU
            </label>
            <Search size={18} />
            <input
              id="wallet-search"
              maxLength={160}
              placeholder="Search product or SKU…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="wallet-button" type="submit">
              Search
            </button>
          </form>
        </div>
        {query.error && (
          <p className="wallet-error" role="alert">
            Unable to load your purchases: {query.error.message}
          </p>
        )}
        {redemption.error && (
          <p className="wallet-error" role="alert">
            Unable to retrieve the current redemption total. Please refresh.
          </p>
        )}
        {query.isPending ? (
          <p className="wallet-empty" role="status">
            Loading your purchases…
          </p>
        ) : purchases.length ? (
          <div className="wallet-table-wrap">
            <table className="wallet-table">
              <caption className="sr-only">
                Your confirmed gold purchases
              </caption>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>QUANTITY / GOLD</th>
                  <th>PURCHASE AMOUNT</th>
                  <th>REDEMPTION VALUE</th>
                  <th>PURCHASED</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Product">
                      <div className="wallet-product">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" loading="lazy" />
                        ) : (
                          <span className="wallet-product-placeholder">
                            <Coins size={24} />
                          </span>
                        )}
                        <div>
                          <strong>{p.product_name}</strong>
                          <span>{p.sku ?? "Gold purchase"}</span>
                          <small>Reference: {p.id.slice(0, 8)}</small>
                        </div>
                      </div>
                    </td>
                    <td data-label="Quantity / gold">
                      <strong>
                        {p.units == null ? 'Quantity unavailable' : `${units(p.units)} ${Number(p.units) === 1 ? 'unit' : 'units'}`}
                      </strong>
                      <span className="wallet-cell-note">
                        {Number(p.oz_amount).toFixed(4)} oz
                      </span>
                    </td>
                    <td data-label="Purchase amount" className="wallet-money">
                      {money(p.purchase_cents)}
                    </td>
                    <td data-label="Redemption value" className="wallet-money">
                      {p.redemption_cents == null ? (
                        <span className="wallet-pending">
                          Awaiting admin value
                        </span>
                      ) : (
                        money(p.redemption_cents)
                      )}
                    </td>
                    <td data-label="Purchased">
                      <time dateTime={p.created_at}>
                        {dateTime(p.created_at)}
                      </time>
                      <span className="wallet-confirmed">Confirmed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !query.error && (
            <div className="wallet-empty">
              <Wallet size={36} />
              <h3>
                {search
                  ? "No matching purchases"
                  : "Your wallet is ready for gold"}
              </h3>
              <p>
                {search
                  ? "Try another product name or SKU."
                  : "Your purchases will appear here once payment is confirmed."}
              </p>
              {search ? (
                <button className="wallet-button" onClick={clear}>
                  Clear search
                </button>
              ) : (
                <Link className="wallet-button primary" to="/app/transact">
                  Explore gold products
                </Link>
              )}
            </div>
          )
        )}
        {!!count && (
          <footer className="wallet-pagination">
            <span>
              Showing {page * 25 + 1}–{Math.min((page + 1) * 25, count)} of{" "}
              {count} purchases
            </span>
            <div>
              <button
                className="wallet-button"
                disabled={page === 0 || query.isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="wallet-button"
                disabled={(page + 1) * 25 >= count || query.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </footer>
        )}
      </section>
      <p className="wallet-footnote">
        Updates every 15 seconds. Redemption values cover only the products and
        quantities you own; handling and delivery fees are separate.
      </p>
    </div>
  );
}
