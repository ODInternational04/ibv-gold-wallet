import React from "react";
import { Star } from "lucide-react";

const reviews = [
  {
    user: "CryptoDisruptor",
    date: "18 | 09 | 2019",
    title: "Real investment made easy",
    text: "Absolutely love the app and how easy it is to buy or sell gold.",
  },
  {
    user: "thinusfrans",
    date: "30 | 05 | 2021",
    title: "Put gold in your pocket",
    text: "This is a great app. A first to help you to invest any $ amount in real gold.",
  },
  {
    user: "Ramon221",
    date: "23 | 04 | 2020",
    title: "Great and easy",
    text: "Really great app! Easy to use, safe reliable buying of real gold! The support team is easy to contact if you doubt anything they help very quick.",
  },
  {
    user: "Nomad capital",
    date: "23 | 08 | 2019",
    title: "Modern Day Tech meets time tested value",
    text: "Amazing App! Seamless way to buy and understand gold and arm yourself against economic downturns. Easy to use and a fun interface.",
  },
  {
    user: "ejamestaylor",
    date: "30 | 03 | 2022",
    title: "Review",
    text: "Awesome platform even better support!",
  },
  {
    user: "James5za",
    date: "16 | 02 | 2021",
    title: "Living in Gold",
    text: "Loving living free!",
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array(5).fill(0).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-[#C9A84C] text-[#C9A84C]" />
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="mx-3 w-72 flex-shrink-0 rounded-xl border border-[#396978]/22 bg-[#1e2c32] p-6">
      <Stars />
      <p className="text-sm font-semibold text-white">{review.user}</p>
      <p className="text-white/30 text-xs mt-1 mb-4">{review.date}</p>
      <h5 className="mb-2 text-base font-light text-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{review.title}</h5>
      <p className="text-white/50 text-xs leading-relaxed">{review.text}</p>
    </div>
  );
}

export default function ReviewsSection() {
  return null;
}
