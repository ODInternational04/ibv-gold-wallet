import React from "react";
import { motion } from "framer-motion";

export default function EarlyAccessBanner() {
  return (
    <section className="bg-[#ffffff] px-6 md:px-10 lg:px-[120px] py-12">
      <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-[#dedbd4] bg-[#faf3e3] md:flex-row">
        <div className="flex-1 p-8 md:p-12">
          <span className="mb-4 inline-block rounded-full border border-[#dedbd4] px-3 py-1 text-sm font-bold tracking-widest text-[#785616]">
            GET EARLY ACCESS
          </span>
          <h2 className="mb-4 text-3xl font-semibold text-[#26231f] md:text-4xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Want New Tools for Your Gold?
          </h2>
          <p className="text-[#57534c] text-base md:text-base leading-relaxed mb-6 max-w-lg">
            A Gold Tools Account will be centered around a Virtual IBV Gold Card. Early access is a way for us to assess real demand before we build it and give loyal users front row seats to the next phase of IBV Gold.
          </p>
          <a
            href="#faq"
            className="text-base font-bold tracking-widest text-[#785616] hover:underline"
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
