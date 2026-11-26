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
      <div className="mb-3 border-b border-white/8 pb-3">
        <p className="text-3xl font-light text-white sm:text-[2rem]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          {priceLoading ? <span className="text-white/40 text-2xl">Loading…</span> : <>{displayPrice} <span className="text-sm font-normal text-white/45">/oz</span></>}
        </p>
        <p className="text-white/30 text-xs mt-1">Live ZAR spot price</p>
      </div>

      <div className="min-h-[12rem] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#396978" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#396978" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={["auto", "auto"]} hide />
            <Tooltip
              contentStyle={{ background: "#162028", border: "1px solid #39697833", borderRadius: 12, color: "#fff" }}
              formatter={(v) => [`R ${v.toLocaleString()}`, "Price"]}
              labelFormatter={() => ""}
            />
            <Area type="monotone" dataKey="price" stroke="#396978" strokeWidth={1.5} fill="url(#goldGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Time range */}
      <div className="mt-3 flex gap-1 justify-between">
        {timeRanges.map((t) => (
          <button
            key={t}
            onClick={() => setRange(t)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${range === t ? "bg-[#396978]/14 text-[#7fb7c9]" : "text-white/30 hover:text-white"}`}
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
            className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-colors ${currency === c ? "bg-[#396978]/14 text-[#7fb7c9]" : "bg-white/5 text-white/40 hover:text-white"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Buy/Sell */}
      <div className="mt-3 flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#2FA36B]/22 bg-[#2FA36B]/12 py-2 text-xs font-bold text-[#6dd09f] transition-colors hover:bg-[#2FA36B]/16">
          Buy
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-white/60 transition-colors hover:bg-white/8">
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
    <div className="flex min-h-[24rem] flex-col rounded-[24px] border border-[#396978]/22 bg-[#1e2c32] p-4 shadow-[0_24px_60px_rgba(30,44,50,0.25)] sm:min-h-[26rem] lg:h-full">
      {chartContent}
    </div>
  );
}
