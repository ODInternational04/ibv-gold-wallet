import React, { useState } from "react";
import { Trophy, TrendingUp, Info, Copy, Share2, Gift, Users, ChevronRight, HelpCircle } from "lucide-react";

export default function Rewards() {
  const [tab, setTab] = useState("progress");

  return (
    <div className="max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <Trophy className="w-4 h-4 text-[#57534c]" />
        <h2 className="text-xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Invite & Earn</h2>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("progress")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-colors ${tab === "progress" ? "border border-[#dedbd4] bg-[#ffffff] text-[#57534c]" : "bg-[#ffffff] text-[#57534c] hover:text-[#26231f]"}`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          My Progress
        </button>
        <button
          onClick={() => setTab("info")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-colors ${tab === "info" ? "border border-[#dedbd4] bg-[#ffffff] text-[#57534c]" : "bg-[#ffffff] text-[#57534c] hover:text-[#26231f]"}`}
        >
          <Info className="w-3.5 h-3.5" />
          Rewards Info
        </button>
      </div>

      {tab === "progress" ? (
        <div className="space-y-4">
          <div className="text-center py-4">
            <h1 className="text-3xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              <span className="text-[#785616]">Unlock</span>{" "}
              Gold Rewards
            </h1>
            <p className="mt-2 text-base text-[#57534c]">
              Invite friends and receive <span className="text-[#785616]">bonus gold</span> when they buy or subscribe within 30 days.
            </p>
          </div>

          {/* Progress bar */}
          <div className="rounded-xl border border-[#dedbd4] bg-[#ffffff] p-5">
            <p className="text-[#57534c] text-sm mb-4">Your Progress:</p>
            <div className="flex justify-between mb-2">
              {[1,2,3,4,5].map(n => (
                <div key={n} className="flex flex-col items-center gap-1">
                  <span className="text-[#57534c] text-sm">0{n}</span>
                  <div className="w-2 h-2 rounded-full border border-[#e3e0da] bg-transparent" />
                </div>
              ))}
            </div>
            <div className="h-1 bg-[#f7f5f0] rounded-full mb-1">
              <div className="h-1 w-0 rounded-full bg-[#faf3e3]" />
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-[#26231f] text-base">0/5 Friends referred</p>
              <span className="rounded-full border border-[#dedbd4] bg-[#faf3e3] px-3 py-1 text-sm font-bold text-[#785616]">5 more for bonus!</span>
            </div>
          </div>

          {/* Rewards Earned */}
          <div className="flex items-center justify-between rounded-xl border border-[#dedbd4] bg-[#ffffff] p-4">
            <div className="flex items-center gap-2">
              <span className="text-[#26231f] text-base">Rewards Earned</span>
              <Info className="w-3.5 h-3.5 text-[#57534c]" />
            </div>
            <span className="bg-[#ffffff] text-[#57534c] text-sm font-bold px-3 py-1 rounded">0.000,000 oz</span>
          </div>

          {/* Referral Code */}
          <div className="rounded-xl border border-[#dedbd4] bg-[#ffffff] p-4">
            <p className="text-[#57534c] text-sm mb-2">Your Referral Code</p>
            <div className="flex items-center justify-between">
              <span className="text-[#26231f] font-bold text-lg tracking-widest">TDE8BC1</span>
              <button className="text-[#57534c] hover:text-[#26231f] transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Invite button */}
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d2a26] py-3 font-bold text-white transition-colors hover:bg-[#454037]">
            <Share2 className="w-4 h-4" />
            Invite Friends
          </button>

          {/* Your Referrals */}
          <div>
            <h4 className="mb-3 text-sm font-bold tracking-wide text-[#57534c]">Your Referrals:</h4>
            <div className="py-6 text-center text-base text-[#57534c]">No referrals yet. Share your referral code to invite friends!</div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="mb-1 text-base font-bold text-[#26231f]">Program Details:</h4>
            <p className="text-sm text-[#57534c]">How to earn gold by inviting friends.</p>
          </div>

          {[
            { icon: Gift, label: "Advocate Reward" },
            { icon: Users, label: "Tier bonuses" },
            { icon: Trophy, label: "Referred Friend (Referee)" },
            { icon: HelpCircle, label: "How It Works" },
          ].map((item) => (
            <button key={item.label} className="flex w-full items-center justify-between rounded-xl border border-[#dedbd4] bg-white px-5 py-4 transition-colors hover:bg-[#ffffff]">
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-[#785616]" />
                <span className="text-base text-[#26231f]">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#57534c]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
