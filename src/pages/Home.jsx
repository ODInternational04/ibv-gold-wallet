import React from "react";
import Navbar from "../components/ibvgold/Navbar";
import MarqueeBanner from "../components/ibvgold/MarqueeBanner";
import HeroSection from "../components/ibvgold/HeroSection";
import PartnersSection from "../components/ibvgold/PartnersSection";
import WhatWeOffer from "../components/ibvgold/WhatWeOffer";
import SecuritySection from "../components/ibvgold/SecuritySection";
import ReviewsSection from "../components/ibvgold/ReviewsSection";
import Footer from "../components/ibvgold/Footer";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f4ee] text-[#162028]">
      <Navbar />
      <div className="pt-16 md:pt-20">
        <MarqueeBanner />
        <HeroSection />
        <PartnersSection />
        <WhatWeOffer />
        <SecuritySection />
        <ReviewsSection />
        <Footer />
      </div>
    </div>
  );
}
