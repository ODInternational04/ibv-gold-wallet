import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useGoldPrice } from "@/hooks/useGoldPrice";

const generateData = (points, base, variance) => {
  const data = [];
  let val = base;
  for (let i = 0; i < points; i++) {
    val = val + (Math.random() - 0.52) * variance;
    data.push({ time: i, price: Math.max(val, base * 0.8) });
  }
  return data;
};

const timeRanges = ["1D", "1W", "1M", "1Y", "5Y"];
const currencies = ["ZAR", "USD", "EUR", "GBP", "BTC", "ETH", "CAD"];

export default function GoldPriceChart({ compact = false }) {
  const [range, setRange] = useState("1D");
  const [currency, setCurrency] = useState("ZAR");
  const { priceZAR, isLoading: priceLoading } = useGoldPrice();

  const basePrice = priceZAR ?? 76568;
  const data = generateData(60, basePrice, basePrice * 0.004);
  const displayPrice = priceZAR
    ? `R ${priceZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'Loading…';

  const chartContent = (
    <>
      <div className="mb-3 border-b border-[#e3e0da] pb-3">
        <p className="text-3xl font-semibold text-[#26231f] sm:text-[2rem]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          {priceLoading ? <span className="text-[#57534c] text-2xl">Loading…</span> : <>{displayPrice} <span className="text-base font-normal text-[#57534c]">/oz</span></>}
        </p>
        <p className="text-[#57534c] text-sm mt-1">Live ZAR spot price</p>
      </div>

      <div className="min-h-[12rem] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#92702b" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#92702b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={["auto", "auto"]} hide />
            <Tooltip
              contentStyle={{ background: "#ffffff", border: "1px solid #92702b33", borderRadius: 12, color: "#39352f" }}
              formatter={(v) => [`R ${v.toLocaleString()}`, "Price"]}
              labelFormatter={() => ""}
            />
            <Area type="monotone" dataKey="price" stroke="#92702b" strokeWidth={2.5} fill="url(#goldGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Time range */}
      <div className="mt-3 flex gap-1 justify-between">
        {timeRanges.map((t) => (
          <button
            key={t}
            onClick={() => setRange(t)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-bold transition-colors ${range === t ? "bg-[#ffffff] text-[#57534c]" : "text-[#57534c] hover:text-[#26231f]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Currency */}
      <div className="mt-2 flex flex-wrap gap-1">
        {currencies.map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            className={`rounded-lg px-2 py-1 text-sm font-bold transition-colors ${currency === c ? "bg-[#ffffff] text-[#57534c]" : "bg-[#f7f5f0] text-[#57534c] hover:text-[#26231f]"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Buy/Sell */}
      <div className="mt-3 flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#dedbd4] bg-[#edf8f1] py-2 text-sm font-bold text-[#57534c] transition-colors hover:bg-[#edf8f1]">
          Buy
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#e3e0da] bg-[#f7f5f0] py-2 text-sm font-bold text-[#57534c] transition-colors hover:bg-[#f7f5f0]">
          Sell
        </button>
      </div>
    </>
  );

  if (compact) {
    return (
      <div className="flex h-80 flex-col p-4">
        {chartContent}
      </div>
    );
  }

  return (
    <div className="flex min-h-[24rem] flex-col rounded-[24px] border border-[#dedbd4] bg-[#ffffff] p-4 shadow-[0_24px_60px_rgba(38,35,31,0.06)] sm:min-h-[26rem] lg:h-full">
      {chartContent}
    </div>
  );
}
