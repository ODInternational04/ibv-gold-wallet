import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Save } from "lucide-react";
import SpotPrice from "@/components/admin/SpotPrice";
import { useGoldPrice } from "@/hooks/useGoldPrice";
import { spotSellingPrice } from "@/lib/spot-selling-price.mjs";
import { supabase } from "@/utils/supabase/client";
import { loadProducts, money, result, toCents } from "@/lib/wallet-api";
import {
  PageHeader,
  ErrorMessage,
  Empty,
  Loading,
  Status,
  Field,
} from "@/components/admin/AdminUI";

function RedemptionValue({ product, onSaved, disabled }) {
  const initial =
    product.redemption_value_cents == null
      ? ""
      : (Number(product.redemption_value_cents) / 100).toFixed(2);
  const [value, setValue] = useState(initial);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const saving = useRef(false);
  const save = async (e) => {
    e.preventDefault();
    if (saving.current || disabled) return;
    saving.current = true;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const cents = toCents(value);
      if (cents > 10000000000)
        throw new Error("The maximum redemption value is R100,000,000.");
      await result(
        supabase
          .from("products")
          .update({ redemption_value_cents: cents })
          .eq("id", product.id)
          .select("id")
          .single(),
      );
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
      saving.current = false;
    }
  };
  return (
    <tr>
      <td>
        <div className="product-cell">
          {product.image_url && <img src={product.image_url} alt="" />}
          <div>
            {product.name}
            <small>
              {product.sku} · {product.weight_label}
            </small>
          </div>
        </div>
      </td>
      <td>
        <Status value={product.active ? "active" : "draft"} />
      </td>
      <td className="amount">
        {product.redemption_value_cents == null
          ? "Not set"
          : money(product.redemption_value_cents)}
      </td>
      <td>
        <form onSubmit={save} style={{ minWidth: 250 }}>
          <div
            className="admin-actions"
            style={{ alignItems: "end", flexWrap: "nowrap" }}
          >
            <Field label="Redemption value (ZAR)">
              <input
                aria-label={`Redemption value for ${product.name}`}
                required
                type="number"
                min="0.01"
                max="100000000"
                step="0.01"
                value={value}
                disabled={busy || disabled}
                onChange={(e) => {
                  setValue(e.target.value);
                  setSaved(false);
                }}
              />
            </Field>
            <button
              className="admin-button primary"
              disabled={busy || disabled || value === initial}
            >
              <Save size={16} />
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-base text-red-700 mt-2">
              {error.message}
            </p>
          )}
          {saved && (
            <p role="status" className="text-base text-emerald-700 mt-2">
              Saved to the customer vault.
            </p>
          )}
        </form>
      </td>
    </tr>
  );
}

export default function AdminRedemptions() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["products", "admin"],
    queryFn: () => loadProducts(true),
  });
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const [bulk, setBulk] = useState(null);
  const [bulkError, setBulkError] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const bulkLock = useRef(false);
  const { refetch: refreshSpot } = useGoldPrice();
  const generateAll = async () => {
    if (bulkLock.current) return;
    bulkLock.current = true;
    setBulkBusy(true);
    setBulkError(null);
    setSaved(false);
    try {
      const latest = await refreshSpot();
      if (latest.error || !latest.data)
        throw new Error(
          "Could not fetch the current spot price. Please try again.",
        );
      const catalog = await loadProducts(true);
      const rows = catalog.map((product) => {
        try {
          return {
            product,
            cents: toCents(
              spotSellingPrice(latest.data.priceZAR, product.oz_amount),
            ),
          };
        } catch (error) {
          throw new Error(`${product.name}: ${error.message}`);
        }
      });
      if (!rows.length)
        throw new Error("Add products before generating redemption values.");
      setBulk({ rows, spot: latest.data.priceZAR });
    } catch (error) {
      setBulkError(error);
    } finally {
      setBulkBusy(false);
      bulkLock.current = false;
    }
  };
  const saveAll = async () => {
    if (bulkLock.current || !bulk) return;
    bulkLock.current = true;
    setBulkBusy(true);
    setBulkError(null);
    let completed = 0;
    try {
      for (const row of bulk.rows) {
        // Match the previewed weight and value to avoid overwriting concurrent edits.
        let update = supabase
          .from("products")
          .update({ redemption_value_cents: row.cents })
          .eq("id", row.product.id)
          .eq("oz_amount", row.product.oz_amount);
        update =
          row.product.redemption_value_cents == null
            ? update.is("redemption_value_cents", null)
            : update.eq(
                "redemption_value_cents",
                row.product.redemption_value_cents,
              );
        await result(update.select("id").single());
        completed++;
      }
      setBulk(null);
      setSaved(true);
    } catch (error) {
      setBulk({ ...bulk, rows: bulk.rows.slice(completed) });
      setBulkError(
        new Error(
          `${completed} saved in this attempt. Remaining values were not saved: ${error.message}. Regenerate if product details changed, or retry Save all.`,
        ),
      );
    } finally {
      client.invalidateQueries({ queryKey: ["products"] });
      client.invalidateQueries({ queryKey: ["redemption-summary"] });
      setBulkBusy(false);
      bulkLock.current = false;
    }
  };
  const products = (query.data ?? []).filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()),
  );
  const refresh = () => {
    setSaved(true);
    client.invalidateQueries({ queryKey: ["redemption-summary"] });
    return client.invalidateQueries({ queryKey: ["products"] });
  };
  return (
    <>
      <PageHeader
        title="Redemption values"
        description="Set the ZAR value shown for each product in the customer's vault."
      >
        <button
          className="admin-button"
          disabled={query.isFetching}
          onClick={() => query.refetch()}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
        <Link className="admin-button" to="/app/vault">
          View customer vault
        </Link>
        <Link className="admin-button" to="/admin/products">
          Generate selling prices
        </Link>
      </PageHeader>
      <SpotPrice />
      <div className="admin-notice">
        <p>
          Generate redemption values for all products, including drafts and
          products hidden by search. Uses one current spot price × each
          product’s gold ounces, with no markup. Review below before saving.
        </p>
        <button
          className="admin-button primary"
          disabled={bulkBusy || query.isPending}
          onClick={generateAll}
        >
          {bulkBusy ? "Working…" : "Generate all redemption values"}
        </button>
      </div>
      <ErrorMessage error={bulkError} />
      {bulk && (
        <section
          className="admin-spot"
          aria-label="Generated redemption values preview"
        >
          <h2>Review generated redemption values</h2>
          <p>
            Spot used: {money(Math.round(bulk.spot * 100))} per troy ounce.{" "}
            {bulk.rows.length} products awaiting save.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>CURRENT VALUE</th>
                  <th>GENERATED REDEMPTION VALUE</th>
                </tr>
              </thead>
              <tbody>
                {bulk.rows.map(({ product, cents }) => (
                  <tr key={product.id}>
                    <td>
                      {product.name}
                      <small>{product.sku}</small>
                    </td>
                    <td>
                      {product.redemption_value_cents == null
                        ? "Not set"
                        : money(product.redemption_value_cents)}
                    </td>
                    <td>{money(cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-actions" style={{ marginTop: 16 }}>
            <button
              className="admin-button primary"
              disabled={bulkBusy}
              onClick={saveAll}
            >
              Save all redemption values
            </button>
            <button
              className="admin-button"
              disabled={bulkBusy}
              onClick={() => {
                setBulk(null);
                setBulkError(null);
              }}
            >
              Discard preview
            </button>
          </div>
        </section>
      )}
      <div className="admin-notice">
        Enter the redemption value for one unit of each product. Purchase prices
        are managed under Products &amp; prices. Published products with a saved
        redemption value appear in the customer vault; updates refresh there
        every 15 seconds.
      </div>
      <ErrorMessage error={query.error} />
      <div className="admin-toolbar">
        <input
          className="admin-search"
          aria-label="Search redemption products"
          placeholder="Search product name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {saved && (
        <p className="admin-success" role="status">
          Redemption values saved. The customer vault will display the new
          values within 15 seconds.
        </p>
      )}
      {query.isPending ? (
        <Loading />
      ) : products.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>VISIBILITY</th>
                <th>CURRENT REDEMPTION VALUE</th>
                <th>SET VALUE</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <RedemptionValue
                  key={`${p.id}:${p.redemption_value_cents}`}
                  product={p}
                  disabled={bulkBusy || bulk !== null}
                  onSaved={refresh}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !query.error && (
          <Empty>
            {search
              ? "No matching products."
              : "Add a product under Products & prices first."}
          </Empty>
        )
      )}
    </>
  );
}
