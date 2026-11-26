import React from "react";
import { Trophy } from "lucide-react";

export default function MarqueeBanner() {
  const items = Array(8).fill("INVITE & EARN IS NOW LIVE");

  return (
    <div className="relative h-[52px] w-full overflow-hidden border-b border-[#C9A84C]/12 bg-gradient-to-r from-[#0a0c0e] via-[#171208] to-[#0a0c0e]">
      <div className="absolute inset-0 flex items-center w-max animate-marquee">
        {items.map((text, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-white font-bold whitespace-nowrap gap-3 text-sm px-8"
          >
            <Trophy className="w-4 h-4 text-[#C9A84C]" />
            <span>
              <span className="underline text-[#C9A84C]">INVITE & EARN</span>{" "}
              <span className="text-white">IS NOW LIVE</span>
            </span>
          </div>
        ))}
        {items.map((text, i) => (
          <div
            key={`dup-${i}`}
            className="flex items-center justify-center text-white font-bold whitespace-nowrap gap-3 text-sm px-8"
          >
            <Trophy className="w-4 h-4 text-[#C9A84C]" />
            <span>
              <span className="underline text-[#C9A84C]">INVITE & EARN</span>{" "}
              <span className="text-white">IS NOW LIVE</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
