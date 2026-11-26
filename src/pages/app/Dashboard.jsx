import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, Scale, CreditCard, ChevronRight, Info, Mail, Clock, CheckCircle2 } from "lucide-react";
import GoldPriceChart from "../../components/app/GoldPriceChart";
import { useVerification } from "@/hooks/useVerification";
import { useGoldPrice } from "@/hooks/useGoldPrice";
import { useHoldings } from "@/hooks/useHoldings";

export default function Dashboard() {
  const { isVerified, isPending, loading: verificationLoading } = useVerification();
  const { priceZAR, isLoading: priceLoading } = useGoldPrice();
  const { totalOz, transactions, isLoading: holdingsLoading } = useHoldings();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState('');

  // A checkout return is not proof of payment. Settlement must be server-confirmed.
  useEffect(() => {
    if (searchParams.get('payment') !== 'success') return;
    sessionStorage.removeItem('pendingTx');
    setSuccessMsg('Sandbox checkout returned. No gold or cash is credited until a payment is independently confirmed.');

    // Clean up URL
    navigate('/app/dashboard', { replace: true });
  }, [searchParams, navigate]);

  const redeemableValue = priceZAR && totalOz > 0 ? totalOz * priceZAR : 0;
  const ozDisplay = totalOz.toFixed(3);
  const zarDisplay = redeemableValue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="flex h-full flex-col gap-4 min-[900px]:flex-row min-[900px]:gap-5">
      {/* Left column */}
      <div className="flex-1 space-y-4">
        {/* Purchase success banner */}
        {successMsg && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-emerald-300 text-sm">{successMsg}</span>
          </div>
        )}
        {/* Verify ID banner — hidden when verified */}
        {!verificationLoading && !isVerified && (
          isPending ? (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-amber-700 font-bold text-sm tracking-widest">UNDER REVIEW</span>
              </div>
              <span className="text-xs text-amber-600/80">Your verification documents are being reviewed. We'll notify you once approved.</span>
            </div>
          ) : (
            <Link to="/registration" className="flex flex-col gap-3 rounded-xl border border-[#396978]/28 bg-[#396978]/12 px-4 py-4 text-white transition-colors hover:bg-[#396978]/16 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#7fb7c9]" />
                <span className="text-[#7fb7c9] font-bold text-sm tracking-widest">VERIFY ID</span>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="text-xs text-white/50">To transact, please verify your identity</span>
                <ChevronRight className="w-4 h-4 text-[#7fb7c9]/55" />
              </div>
            </Link>
          )
        )}

        {/* Redeem card */}
        <Link to="/app/vault" className="block rounded-xl border border-[#e5dfd5] bg-white p-4 transition-all hover:border-[#c9c0b4] hover:shadow-sm sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[#C9A84C] text-[10px] font-semibold bg-[#C9A84C]/12 px-1.5 py-0.5 rounded tracking-[0.2em]">AU</span>
              <Scale className="w-4 h-4 text-[#C9A84C]/70" />
              <span className="text-[#22303a]/55 font-semibold text-xs tracking-widest">REDEEM</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#b0bcc5]" />
          </div>
          <p className="text-[#8d979d] text-xs mb-1 tracking-wide">Available balance</p>
          <p
            className="text-[#22303a] font-light text-3xl mb-3"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >{holdingsLoading ? '...' : `${ozDisplay} oz`}</p>
          <p className="text-[#8d979d] text-xs mb-1 tracking-wide">Redeemable value</p>
          <div className="flex items-center gap-2 mb-3">
            <p
              className="text-[#22303a] font-light text-lg"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >{priceLoading || holdingsLoading ? 'Loading…' : `ZAR ${zarDisplay}`}</p>
            <Info className="w-3.5 h-3.5 text-[#b0bcc5]" />
          </div>
          <p className="text-[#8d979d] text-xs mb-1 tracking-wide">Physical stock status</p>
          <div className="flex items-center gap-2">
            <p className="text-[#66737c] text-sm">No redemption requests yet</p>
            <Info className="w-3.5 h-3.5 text-[#b0bcc5]" />
          </div>
        </Link>

        {/* Join Early Access */}
        <div className="flex items-center justify-between rounded-xl border border-[#C9A84C]/30 bg-[#fffbf0] px-4 py-4 transition-colors hover:border-[#C9A84C]/45 sm:px-5">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-[#396978]" />
            <div>
              <p className="text-[#8d979d] text-[10px] font-bold tracking-widest">JOIN FOR</p>
              <p className="text-[#C9A84C] text-xs font-semibold tracking-widest">EARLY ACCESS</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#b0bcc5]" />
        </div>

        {/* Latest Transactions */}
        <div className="rounded-xl border border-[#e5dfd5] bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3
              className="text-[#22303a]/80 font-light text-lg"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >Latest Transactions</h3>
            <button className="flex items-center gap-2 text-left text-xs text-[#8d979d] sm:text-right">
              <span>export CSV</span>
              <div className="w-7 h-7 bg-[#396978]/10 rounded flex items-center justify-center">
                <Mail className="w-3.5 h-3.5 text-[#7fb7c9]" />
              </div>
            </button>
          </div>
          {holdingsLoading ? (
            <div className="text-center py-8 text-[#b0bcc5] text-sm">Loading…</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-[#b0bcc5] text-sm">No items available</div>
          ) : (
            <div className="divide-y divide-[#e5dfd5]">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id ?? tx.created_at} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[#22303a] text-sm font-medium">{tx.product_name}</p>
                    <p className="text-[#8d979d] text-xs mt-0.5">{new Date(tx.created_at).toLocaleDateString('en-ZA')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#22303a] text-sm font-medium">+{Number(tx.oz_amount).toFixed(4)} oz</p>
                    <p className="text-[#8d979d] text-xs mt-0.5">ZAR {Number(tx.purchase_price_zar).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="w-full text-center text-[#66737c] text-sm font-medium py-2 border border-[#e5dfd5] rounded-xl hover:bg-[#f5f0e8] transition-colors">View All</button>
        </div>
      </div>

      {/* Right column - Chart */}
      <div className="w-full flex-shrink-0 min-[900px]:w-64">
        <GoldPriceChart />
      </div>
    </div>
  );
}
