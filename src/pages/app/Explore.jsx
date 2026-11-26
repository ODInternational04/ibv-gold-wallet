import React, { useState } from "react";
import { Scale } from "lucide-react";
import GoldPriceChart from "../../components/app/GoldPriceChart";

const mockVideos = [
  { source: "IBV Gold", date: "17 March | 2026", title: "Gold In The Real World Ep 1 Michael Quinert On Gold Mining Investing Opening Qala Shallows Mine", excerpt: "Gold In The Real World Is IBV Golds Series Exploring The Role Gold Continues To Play In Modern Finance Global Markets And Long Term Wealth Preservation In This Episode We Sit Down With Michael Quinert Chairman Of..." },
  { source: "IBV Gold", date: "23 September | 2025", title: "Gold Is Now On Whats App The New IBV Gold Whats App App", excerpt: "Everything Inside The IBV Gold Mobile App Reimagined For Whats App Gold Investing Is Now A Whats App Message Away..." },
  { source: "IBV Gold", date: "24 December | 2024", title: "IBV HQ 2024 A Year In Review", excerpt: "Wave Learned Worked Had Fun And Grown A Lot This Year We Were Excited And Motivated To Keep Building The Future In Gold Stay Golden IBV Users See You In 2025..." },
];

export default function Explore() {
  const [tab, setTab] = useState("videos");

  return (
    <div className="flex flex-col gap-5 min-[900px]:flex-row">
      {/* Left - Gold Price */}
      <div className="flex-1">
        <div className="mb-5 overflow-hidden rounded-[24px] border border-[#dedbd4] bg-[#ffffff]">
          <div className="flex items-center gap-2 border-b border-[#e3e0da] px-5 py-4">
            <span className="rounded bg-[#faf3e3] px-1.5 py-0.5 text-sm font-semibold tracking-[0.2em] text-[#785616]">AU</span>
            <Scale className="w-4 h-4 text-[#785616]" />
            <span className="text-[#26231f] text-sm font-semibold tracking-widest">GOLD PRICE</span>
          </div>
          <GoldPriceChart compact />
        </div>
      </div>

      {/* Right - News & Videos */}
      <div className="w-full flex-shrink-0 min-[900px]:w-80">
        <div className="h-full rounded-[24px] border border-[#dedbd4] bg-white p-5">
          <h3 className="mb-4 text-xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Gold News and Videos</h3>

          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setTab("news")}
              className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${tab === "news" ? "bg-[#faf3e3] text-[#785616] border border-[#d8bd83]" : "bg-[#ffffff] text-[#57534c] hover:text-[#26231f]"}`}
            >
              News
            </button>
            <button
              onClick={() => setTab("videos")}
              className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${tab === "videos" ? "bg-[#ffffff] text-[#57534c] border border-[#dedbd4]" : "bg-[#ffffff] text-[#57534c] hover:text-[#26231f]"}`}
            >
              Videos
            </button>
          </div>

          <div className="space-y-4">
            {mockVideos.map((v, i) => (
              <div key={i} className="flex cursor-pointer gap-3 border-b border-[#dedbd4] pb-4 last:border-0 hover:opacity-80">
                <div className="h-12 w-16 flex-shrink-0 rounded bg-[#ffffff]" />
                <div>
                  <p className="text-[#57534c] text-sm mb-1">{v.source} {v.date}</p>
                  <p className="mb-1 text-sm font-semibold text-[#26231f] line-clamp-2">{v.title}</p>
                  <p className="text-[#57534c] text-sm line-clamp-2">{v.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
