import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  Scale,
  ChevronRight,
  Info,
  Mail,
  Clock,
} from "lucide-react";
import PaymentStatus from "@/components/app/PaymentStatus";
import GoldPriceChart from "../../components/app/GoldPriceChart";
import { useVerification } from "@/hooks/useVerification";
import { useRedemptionSummary } from "@/hooks/useRedemptionSummary";
import { useHoldings } from "@/hooks/useHoldings";

export default function Dashboard() {
  const {
    isVerified,
    isPending,
    loading: verificationLoading,
  } = useVerification();
  const redemption = useRedemptionSummary();
  const { totalOz, transactions, isLoading: holdingsLoading } = useHoldings();
  const [searchParams] = useSearchParams();
  const ozDisplay = totalOz.toFixed(3);
  return (
    <div className="flex h-full flex-col gap-4 min-[900px]:flex-row min-[900px]:gap-5">
      {/* Left column */}
      <div className="flex-1 space-y-4">
        {(searchParams.get("payment") === "returned" ||
          searchParams.get("payment") === "success") && (
          <PaymentStatus
            key={searchParams.get("order")}
            orderId={searchParams.get("order")}
          />
        )}
        {/* Verify ID banner — hidden when verified */}
        {!verificationLoading &&
          !isVerified &&
          (isPending ? (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-700" />
                <span className="text-amber-700 font-bold text-base tracking-widest">
                  UNDER REVIEW
                </span>
              </div>
              <span className="text-sm text-amber-600/80">
                Your verification documents are being reviewed. We'll notify you
                once approved.
              </span>
            </div>
          ) : (
            <Link
              to="/registration"
              className="flex flex-col gap-3 rounded-xl border border-[#dedbd4] bg-[#ffffff] px-4 py-4 text-[#26231f] transition-colors hover:bg-[#ffffff] sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#57534c]" />
                <span className="text-[#57534c] font-bold text-base tracking-widest">
                  VERIFY ID
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="text-sm text-[#57534c]">
                  To transact, please verify your identity
                </span>
                <ChevronRight className="w-4 h-4 text-[#57534c]" />
              </div>
            </Link>
          ))}

        {/* Redeem card */}
        <Link
          to="/app/vault"
          className="block rounded-xl border border-[#dedbd4] bg-white p-4 transition-all hover:border-[#dedbd4] hover:shadow-sm sm:p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[#785616] text-sm font-semibold bg-[#faf3e3] px-1.5 py-0.5 rounded tracking-[0.2em]">
                AU
              </span>
              <Scale className="w-4 h-4 text-[#785616]" />
              <span className="text-[#26231f] font-semibold text-sm tracking-widest">
                REDEEM
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#57534c]" />
          </div>
          <p className="text-[#57534c] text-sm mb-1 tracking-wide">
            Available balance
          </p>
          <p
            className="text-[#26231f] font-semibold text-3xl mb-3"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {holdingsLoading ? "..." : `${ozDisplay} oz`}
          </p>
          <p className="text-[#57534c] text-sm mb-1 tracking-wide">
            Redeemable value
          </p>
          <div className="flex items-center gap-2 mb-3">
            <p
              className="text-[#26231f] font-semibold text-lg"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {redemption.valueText}
            </p>
            <Info className="w-3.5 h-3.5 text-[#57534c]" />
          </div>
          <p className="mb-3 text-sm text-[#57534c]">
            {redemption.error
              ? "Unable to retrieve admin redemption values. Please try again shortly."
              : redemption.missingPrices
                ? "An admin redemption value is needed for one or more of your holdings."
                : "Based on the current redemption values set by IBV Gold. Delivery fees are separate."}
          </p>
          <p className="text-[#57534c] text-sm mb-1 tracking-wide">
            Physical stock status
          </p>
          <div className="flex items-center gap-2">
            <p className="text-[#57534c] text-base">
              No redemption requests yet
            </p>
            <Info className="w-3.5 h-3.5 text-[#57534c]" />
          </div>
        </Link>

        {/* Latest Transactions */}
        <div className="rounded-xl border border-[#dedbd4] bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3
              className="text-[#26231f] font-semibold text-lg"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Latest Transactions
            </h3>
            <button className="flex items-center gap-2 text-left text-sm text-[#57534c] sm:text-right">
              <span>export CSV</span>
              <div className="w-7 h-7 bg-[#ffffff] rounded flex items-center justify-center">
                <Mail className="w-3.5 h-3.5 text-[#57534c]" />
              </div>
            </button>
          </div>
          {holdingsLoading ? (
            <div className="text-center py-8 text-[#57534c] text-base">
              Loading…
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-[#57534c] text-base">
              No items available
            </div>
          ) : (
            <div className="divide-y divide-[#e5dfd5]">
              {transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id ?? tx.created_at}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-[#26231f] text-base font-medium">
                      {tx.product_name}
                    </p>
                    <p className="text-[#57534c] text-sm mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString("en-ZA")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#26231f] text-base font-medium">
                      +{Number(tx.oz_amount).toFixed(4)} oz
                    </p>
                    <p className="text-[#57534c] text-sm mt-0.5">
                      ZAR{" "}
                      {Number(tx.purchase_price_zar).toLocaleString("en-ZA", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/app/wallet" className="block w-full text-center text-[#57534c] text-base font-medium py-2 border border-[#dedbd4] rounded-xl hover:bg-[#ffffff] transition-colors">
            View All
          </Link>
        </div>
      </div>

      {/* Right column - Chart */}
      <div className="w-full flex-shrink-0 min-[900px]:w-64">
        <GoldPriceChart />
      </div>
    </div>
  );
}
