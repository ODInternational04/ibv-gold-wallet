import React from "react";
import { RefreshCw } from "lucide-react";
import { useGoldPrice } from "@/hooks/useGoldPrice";

const currency = (value, code = "ZAR") =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: code }).format(
    value,
  );

export default function SpotPrice() {
  const { prices, isPending, isFetching, isError, refetch } = useGoldPrice();
  return (
    <section className="admin-spot" aria-labelledby="spot-price-title">
      <div className="admin-spot-heading">
        <div>
          <h2 id="spot-price-title">Gold spot price</h2>
          <p>Market reference for setting your redemption values.</p>
        </div>
        <button
          className="admin-button"
          disabled={isFetching}
          onClick={() => refetch()}
        >
          <RefreshCw size={16} />
          {isFetching ? "Refreshing…" : "Refresh spot price"}
        </button>
      </div>
      {isPending ? (
        <p role="status">Loading spot price…</p>
      ) : prices ? (
        <>
          <dl className="admin-spot-grid">
            <div>
              <dt>ZAR / troy ounce</dt>
              <dd>{currency(prices.priceZAR)}</dd>
            </div>
            <div>
              <dt>ZAR / gram</dt>
              <dd>{currency(prices.pricePerGramZAR)}</dd>
            </div>
            <div>
              <dt>USD / troy ounce</dt>
              <dd>{currency(prices.usdPerOz, "USD")}</dd>
            </div>
            <div>
              <dt>USD / ZAR</dt>
              <dd>{prices.usdZar.rate.toFixed(4)}</dd>
            </div>
          </dl>
          <p className="admin-spot-note">
            Sources: {prices.source} · {prices.usdZar.source}. Fetched{" "}
            {new Intl.DateTimeFormat("en-ZA", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Africa/Johannesburg",
            }).format(new Date(prices.updatedAt))}{" "}
            SAST. Refreshes every minute.
            {prices.usdZar.rateDate &&
              ` Exchange rate dated ${prices.usdZar.rateDate}.`}
          </p>
        </>
      ) : null}
      {isError && (
        <p role="alert" className="text-red-700">
          {prices
            ? "Refresh failed. The values above are from the last successful fetch."
            : "Spot price is temporarily unavailable. Please refresh shortly."}
        </p>
      )}
      <p className="admin-spot-note">
        This reference does not automatically change product redemption values.
      </p>
    </section>
  );
}
