import React from "react";
import { motion } from "framer-motion";

const features = [
  {
    icon: "/1.png",
    title: "Securely vaulted",
    desc: "Gold 1oz Krugerrands are procured and securely stored in IBV Vaults in Johannesburg.",
  },
  {
    icon: "/2.png",
    title: "Fully insured",
    desc: "All gold holdings are fully insured against loss by a leading insurance provider.",
  },
  {
    icon: "/3.png",
    title: "Uniquely numbered",
    desc: "Each 1oz Krugerrand is uniquely numbered, allocated and segregated in the vault.",
  },
  {
    icon: "/4.png",
    title: "Redeem anytime",
    desc: "Withdraw your gold anytime and have it courier delivered to your door in 1oz denominations.",
  },
];

export default function SecuritySection() {
  return (
    <section id="about" className="bg-[#ffffff] px-6 py-20 md:px-10 lg:px-[120px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="text-center"
          >
            <img
              src={f.icon}
              alt={f.title}
              className="w-16 h-16 mx-auto mb-5 object-contain"
            />
            <h4 className="mb-3 text-lg font-semibold text-[#26231f]">{f.title}</h4>
            <p className="text-base leading-relaxed text-[#57534c]">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-16 text-center"
      >
        <p className="text-lg font-medium tracking-wide text-[#57534c]">
          The highest security standards. 100% physically backed.
        </p>
      </motion.div>
    </section>
  );
}
