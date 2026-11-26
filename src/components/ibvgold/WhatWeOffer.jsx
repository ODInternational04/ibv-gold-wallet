import React from "react";
import { motion } from "framer-motion";

const offerings = [
  {
    label: "buy & invest",
    title: "Build your digital gold portfolio.",
    image: "/5.png",
    imageClassName: "max-w-[17.28rem] max-h-[10.44rem]",
    bg: "from-white/60 to-black",
  },
  {
    label: "Upload your gold",
    title: "Digitise your gold Krugerrands.",
    image: "/8.png",
    bg: "from-white/60 to-black",
  },
  {
    label: "Credit Facility",
    title: "Access a credit facility for gold liquidity.",
    image: "/6.png",
    bg: "from-white/60 to-black",
  },
  {
    label: "For Business",
    title: "Get a zero-inflation business account.",
    image: "/7.png",
    bg: "from-white/60 to-black",
  },
];

export default function WhatWeOffer() {
  return (
    <section id="what-we-offer" className="bg-[#ffffff] px-6 py-20 md:px-10 lg:px-[120px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {offerings.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className={`relative group cursor-pointer overflow-hidden rounded-2xl border border-[#e3e0da] bg-gradient-to-b ${item.bg} transition-all duration-500 hover:border-[#dedbd4]`}
          >
            <div className="p-8 pb-0">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-[#785616]">
                {item.label}
              </p>
              <h3 className="text-xl font-semibold leading-tight text-[#26231f] md:text-2xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                {item.title}
              </h3>
            </div>
            <div className="flex justify-center items-end mt-6 px-8">
              <img
                src={item.image}
                alt={item.label}
                className={`w-full object-contain group-hover:scale-105 transition-transform duration-500 ${item.imageClassName ?? "max-w-[14.4rem] max-h-[8.64rem]"}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
