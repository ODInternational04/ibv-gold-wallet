import React from "react";
import { motion } from "framer-motion";

export default function EarlyAccessBanner() {
  return (
    <section className="bg-[#f5f0e4] px-6 md:px-10 lg:px-[120px] py-12">
      <div className="relative bg-gradient-to-r from-[#1e2c32] via-[#182838] to-[#1e2c32] border border-[#F5C518]/25 rounded-2xl overflow-hidden flex flex-col md:flex-row items-center">
        <div className="flex-1 p-8 md:p-12">
          <span className="inline-block text-[#F5C518] font-bold text-xs tracking-widest mb-4 border border-[#F5C518]/30 px-3 py-1 rounded-full">
            GET EARLY ACCESS
          </span>
          <h2 className="text-white text-2xl md:text-3xl font-semibold mb-4">
            Want New Tools for Your Gold?
          </h2>
          <p className="text-white/50 text-sm md:text-base leading-relaxed mb-6 max-w-lg">
            A Gold Tools Account will be centered around a Virtual IBV Gold Card. Early access is a way for us to assess real demand before we build it and give loyal users front row seats to the next phase of IBV Gold.
          </p>
          <a
            href="#faq"
            className="text-[#F5C518] font-bold text-sm tracking-widest hover:underline"
          >
            READ FAQs
          </a>
        </div>
        <div className="w-full md:w-auto flex-shrink-0 p-6 md:p-0 md:pr-12">
          <img
            src="https://troygold.app/_next/image?url=%2Fimages%2Fearly-access%2Fbanner-phone-desktop.webp&w=640&q=75"
            alt="IBV Gold Card"
            className="w-48 md:w-56 mx-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
}