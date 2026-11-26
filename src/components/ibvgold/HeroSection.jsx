import React from "react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center overflow-hidden bg-[#ffffff] px-6 pb-16 pt-12 md:px-10 md:pt-20 lg:flex-row lg:px-[120px]">
      {/* Decorative gold dots */}
      <div className="absolute top-32 right-[45%] hidden lg:flex gap-2">
        <div className="flex flex-col gap-2">
          <div className="w-2 h-2 bg-[#faf3e3]" />
          <div className="w-2 h-2 bg-[#faf3e3]" />
        </div>
        <div className="flex flex-col gap-2 mt-3">
          <div className="w-2 h-2 bg-[#faf3e3]" />
        </div>
      </div>
      <div className="absolute top-40 right-10 hidden lg:flex gap-2">
        <div className="w-2 h-2 bg-[#faf3e3]" />
        <div className="flex flex-col gap-2">
          <div className="w-2 h-2 bg-[#faf3e3]" />
          <div className="w-2 h-2 bg-[#faf3e3]" />
        </div>
      </div>
      <div className="absolute bottom-20 right-[35%] hidden lg:flex gap-2">
        <div className="flex flex-col gap-2">
          <div className="w-2 h-2 bg-[#faf3e3]" />
          <div className="w-2 h-2 bg-[#faf3e3]" />
        </div>
        <div className="mt-3">
          <div className="w-2 h-2 bg-[#faf3e3]" />
        </div>
      </div>

      {/* Left text */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full lg:w-1/2 text-center lg:text-left"
      >
        <h1 className="text-5xl font-semibold leading-tight text-[#26231f] lg:text-6xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Real gold.
          <br />
          <span className="text-[#785616]">In your pocket.</span>
        </h1>

        <p className="mt-6 max-w-lg mx-auto text-lg font-medium leading-relaxed text-[#57534c] lg:mx-0 lg:text-xl">
          A gold bullion-backed account for an inflation-free financial life. Buy, sell, upload, or borrow against real gold.
        </p>

        <div className="mt-10 max-w-md mx-auto lg:mx-0">
          <p className="text-[#57534c] text-base lg:text-lg">Secured by</p>
          <div className="mt-3 mb-4">
            <img
              src="/ibv-gold-logo.png"
              alt="IBV Gold Logo"
              className="h-16 mx-auto lg:mx-0"
            />
          </div>
          <p className="text-[#57534c] text-base lg:text-lg">
            Your gold is securely stored & accounted for by world-class, trusted institutions.
          </p>
        </div>

        <div className="mt-12">
          <a
            href="/registration"
            className="inline-block rounded-xl border-2 border-[#2d2a26] bg-[#2d2a26] px-10 py-3.5 text-base font-bold tracking-widest text-white transition-all duration-300 hover:bg-[#454037]"
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
