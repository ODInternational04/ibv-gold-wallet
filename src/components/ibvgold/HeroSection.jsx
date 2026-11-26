import React from "react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center overflow-hidden bg-[#f7f4ee] px-6 pb-16 pt-12 md:px-10 md:pt-20 lg:flex-row lg:px-[120px]">
      {/* Decorative gold dots */}
      <div className="absolute top-32 right-[45%] hidden lg:flex gap-2">
        <div className="flex flex-col gap-2">
          <div className="w-2 h-2 bg-[#C9A84C]" />
          <div className="w-2 h-2 bg-[#C9A84C]" />
        </div>
        <div className="flex flex-col gap-2 mt-3">
          <div className="w-2 h-2 bg-[#C9A84C]" />
        </div>
      </div>
      <div className="absolute top-40 right-10 hidden lg:flex gap-2">
        <div className="w-2 h-2 bg-[#C9A84C]" />
        <div className="flex flex-col gap-2">
          <div className="w-2 h-2 bg-[#C9A84C]" />
          <div className="w-2 h-2 bg-[#C9A84C]" />
        </div>
      </div>
      <div className="absolute bottom-20 right-[35%] hidden lg:flex gap-2">
        <div className="flex flex-col gap-2">
          <div className="w-2 h-2 bg-[#C9A84C]" />
          <div className="w-2 h-2 bg-[#C9A84C]" />
        </div>
        <div className="mt-3">
          <div className="w-2 h-2 bg-[#C9A84C]" />
        </div>
      </div>

      {/* Left text */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full lg:w-1/2 text-center lg:text-left"
      >
        <h1 className="text-5xl font-light leading-tight text-[#162028] lg:text-6xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Real gold.
          <br />
          <span className="text-[#C9A84C]">In your pocket.</span>
        </h1>

        <p className="mt-6 max-w-lg mx-auto text-lg font-medium leading-relaxed text-[#44515a] lg:mx-0 lg:text-xl">
          A gold bullion-backed account for an inflation-free financial life. Buy, sell, upload, or borrow against real gold.
        </p>

        <div className="mt-10 max-w-md mx-auto lg:mx-0">
          <p className="text-[#5A5C63] text-base lg:text-lg">Secured by</p>
          <div className="mt-3 mb-4">
            <img
              src="/ibv-gold-logo.png"
              alt="IBV Gold Logo"
              className="h-16 mx-auto lg:mx-0"
            />
          </div>
          <p className="text-[#5A5C63] text-base lg:text-lg">
            Your gold is securely stored & accounted for by world-class, trusted institutions.
          </p>
        </div>

        <div className="mt-12">
          <a
            href="/registration"
            className="inline-block border-2 border-[#396978] px-10 py-3.5 text-sm font-bold tracking-widest text-[#7fb7c9] transition-all duration-300 hover:bg-[#396978] hover:text-white"
          >
            GET STARTED
          </a>
        </div>
      </motion.div>

      {/* Right hero image */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="w-full lg:w-1/2 mt-12 lg:mt-0 flex justify-center lg:justify-end"
      >
        <img
          src="/hero-image.png"
          alt="IBV Gold App Interface"
          className="w-full max-w-2xl rounded-3xl object-contain"
        />
      </motion.div>
    </section>
  );
}
