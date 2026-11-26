import React from "react";
import { Heart, Bell, ChevronRight, User, Building2, MapPin, FolderOpen, ScrollText, FileText, History, Shield, Settings2 } from "lucide-react";

export default function AppSettings() {
  const rowClassName = "w-full flex items-center justify-between rounded-xl border border-[#e5dfd5] bg-white px-5 py-4 transition-colors hover:bg-[#f5f0e8]";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Top actions */}
      <div className="space-y-2">
        <button className={rowClassName}>
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-[#396978]" />
            <span className="text-sm text-[#22303a]/80">SHARE WITH FRIENDS</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#b0bcc5]" />
        </button>
        <button className={rowClassName}>
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-[#396978]" />
            <span className="text-sm text-[#22303a]/80">NOTIFICATIONS</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#b0bcc5]" />
        </button>
      </div>

      {/* Details */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-[#7a848a]" />
          <h3 className="text-[#7a848a] text-xs font-bold tracking-widest">DETAILS</h3>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#e5dfd5] bg-white">
          {[
            { icon: User, label: "PERSONAL" },
            { icon: Building2, label: "BANKING" },
            { icon: MapPin, label: "ADDRESS" },
          ].map((item, i) => (
            <button
              key={item.label}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-[#f5f0e8] transition-colors ${i > 0 ? "border-t border-[#f0ece4]" : ""}`}
            >
              <span className="text-[#22303a]/80 text-xs font-bold tracking-wide">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-[#b0bcc5]" />
            </button>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen className="w-4 h-4 text-[#7a848a]" />
          <h3 className="text-[#7a848a] text-xs font-bold tracking-widest">DOCUMENTS</h3>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#e5dfd5] bg-white">
          {[
            { label: "OWNERSHIP REGISTER" },
            { label: "TAX SUMMARY" },
            { label: "TRANSACTION HISTORY" },
          ].map((item, i) => (
            <button
              key={item.label}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-[#f5f0e8] transition-colors ${i > 0 ? "border-t border-[#f0ece4]" : ""}`}
            >
              <span className="text-[#22303a]/80 text-xs font-bold tracking-wide">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-[#b0bcc5]" />
            </button>
          ))}
        </div>
      </div>

      {/* Verification */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#7a848a]" />
          <h3 className="text-[#7a848a] text-xs font-bold tracking-widest">VERIFICATION</h3>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#e5dfd5] bg-white">
          <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f5f0e8] transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-[#22303a]/80 text-xs font-bold tracking-wide">IDENTITY</span>
              <span className="w-4 h-4 rounded-full border-2 border-red-400 flex items-center justify-center text-red-400 text-[10px]">!</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#b0bcc5]" />
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="w-4 h-4 text-[#7a848a]" />
          <h3 className="text-[#7a848a] text-xs font-bold tracking-widest">PREFERENCES</h3>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#e5dfd5] bg-white">
          {[
            { label: "DISPLAY CURRENCY" },
            { label: "LANGUAGE" },
            { label: "THEME" },
          ].map((item, i) => (
            <button
              key={item.label}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-[#f5f0e8] transition-colors ${i > 0 ? "border-t border-[#f0ece4]" : ""}`}
            >
              <span className="text-[#22303a]/80 text-xs font-bold tracking-wide">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-[#b0bcc5]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
