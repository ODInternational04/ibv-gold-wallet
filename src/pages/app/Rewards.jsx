import React, { useState } from "react";
import { Trophy, TrendingUp, Info, Copy, Share2, Gift, Users, ChevronRight, HelpCircle } from "lucide-react";

export default function Rewards() {
  const [tab, setTab] = useState("progress");

  return (
    <div className="max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <Trophy className="w-4 h-4 text-[#396978]/75" />
        <h2 className="text-xl font-semibold text-[#22303a]/85" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Invite & Earn</h2>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("progress")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-colors ${tab === "progress" ? "border border-[#396978]/22 bg-[#396978]/14 text-[#396978]" : "bg-[#efe8dc] text-[#66737c] hover:text-[#22303a]"}`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          My Progress
        </button>
        <button
          onClick={() => setTab("info")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-colors ${tab === "info" ? "border border-[#396978]/22 bg-[#396978]/14 text-[#396978]" : "bg-[#efe8dc] text-[#66737c] hover:text-[#22303a]"}`}
        >
          <Info className="w-3.5 h-3.5" />
          Rewards Info
        </button>
      </div>

      {tab === "progress" ? (
        <div className="space-y-4">
          <div className="text-center py-4">
            <h1 className="text-3xl font-semibold text-[#162028]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              <span className="text-[#C9A84C]">Unlock</span>{" "}
              Gold Rewards
            </h1>
            <p className="mt-2 text-sm text-[#66737c]">
              Invite friends and receive <span className="text-[#C9A84C]">bonus gold</span> when they buy or subscribe within 30 days.
            </p>
          </div>

          {/* Progress bar */}
          <div className="rounded-xl border border-[#396978]/20 bg-[#1e2c32] p-5">
            <p className="text-white/50 text-xs mb-4">Your Progress:</p>
            <div className="flex justify-between mb-2">
              {[1,2,3,4,5].map(n => (
                <div key={n} className="flex flex-col items-center gap-1">
                  <span className="text-white/30 text-[10px]">0{n}</span>
                  <div className="w-2 h-2 rounded-full border border-white/30 bg-transparent" />
                </div>
              ))}
            </div>
            <div className="h-1 bg-white/10 rounded-full mb-1">
              <div className="h-1 w-0 rounded-full bg-[#C9A84C]" />
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-white text-sm">0/5 Friends referred</p>
              <span className="rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 text-[10px] font-bold text-[#C9A84C]">5 more for bonus!</span>
            </div>
          </div>

          {/* Rewards Earned */}
          <div className="flex items-center justify-between rounded-xl border border-[#396978]/20 bg-[#1e2c32] p-4">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">Rewards Earned</span>
              <Info className="w-3.5 h-3.5 text-white/30" />
            </div>
            <span className="bg-[#1a3a00] text-[#4ade80] text-xs font-bold px-3 py-1 rounded">0.000,000 oz</span>
          </div>

          {/* Referral Code */}
          <div className="rounded-xl border border-[#396978]/20 bg-[#1e2c32] p-4">
            <p className="text-white/40 text-xs mb-2">Your Referral Code</p>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-lg tracking-widest">TDE8BC1</span>
              <button className="text-white/40 hover:text-white transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Invite button */}
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#396978] py-3 font-bold text-white transition-colors hover:bg-[#2f5b6d]">
            <Share2 className="w-4 h-4" />
            Invite Friends
          </button>

          {/* Your Referrals */}
          <div>
            <h4 className="mb-3 text-xs font-bold tracking-wide text-[#66737c]">Your Referrals:</h4>
            <div className="py-6 text-center text-sm text-[#8d979d]">No referrals yet. Share your referral code to invite friends!</div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="mb-1 text-sm font-bold text-[#22303a]">Program Details:</h4>
            <p className="text-xs text-[#66737c]">How to earn gold by inviting friends.</p>
          </div>

          {[
            { icon: Gift, label: "Advocate Reward" },
            { icon: Users, label: "Tier bonuses" },
            { icon: Trophy, label: "Referred Friend (Referee)" },
            { icon: HelpCircle, label: "How It Works" },
          ].map((item) => (
            <button key={item.label} className="flex w-full items-center justify-between rounded-xl border border-[#e5dfd5] bg-white px-5 py-4 transition-colors hover:bg-[#f5f0e8]">
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-[#C9A84C]" />
                <span className="text-sm text-[#22303a]/80">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#b0bcc5]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
