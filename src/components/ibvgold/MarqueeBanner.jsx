import React from "react";
import { Trophy } from "lucide-react";

export default function MarqueeBanner() {
  const items = Array(8).fill("INVITE & EARN IS NOW LIVE");

  return (
    <div className="relative h-[52px] w-full overflow-hidden border-b border-[#dedbd4] bg-[#faf3e3]">
      <div className="absolute inset-0 flex items-center w-max animate-marquee">
        {items.map((text, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-[#26231f] font-bold whitespace-nowrap gap-3 text-base px-8"
          >
            <Trophy className="w-4 h-4 text-[#785616]" />
            <span>
              <span className="underline text-[#785616]">INVITE & EARN</span>{" "}
              <span className="text-[#26231f]">IS NOW LIVE</span>
            </span>
          </div>
        ))}
        {items.map((text, i) => (
          <div
            key={`dup-${i}`}
            className="flex items-center justify-center text-[#26231f] font-bold whitespace-nowrap gap-3 text-base px-8"
          >
            <Trophy className="w-4 h-4 text-[#785616]" />
            <span>
              <span className="underline text-[#785616]">INVITE & EARN</span>{" "}
              <span className="text-[#26231f]">IS NOW LIVE</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
