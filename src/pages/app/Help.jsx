import React from "react";
import { HelpCircle, ChevronRight, MessageCircle, Mail, Book } from "lucide-react";

const faqs = [
  "How do I buy gold?",
  "How do I sell gold?",
  "What is the minimum purchase amount?",
  "How is my gold stored?",
  "How do I withdraw my gold?",
  "What is the credit facility?",
  "How do I verify my identity?",
];

export default function Help() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <HelpCircle className="w-4 h-4 text-[#57534c]" />
        <h2 className="text-xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Help Center</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: MessageCircle, label: "Live Chat" },
          { icon: Mail, label: "Email Us" },
          { icon: Book, label: "FAQs" },
        ].map((item) => (
          <button key={item.label} className="flex flex-col items-center gap-2 rounded-xl border border-[#dedbd4] bg-white p-5 transition-colors hover:bg-[#ffffff]">
            <item.icon className="w-6 h-6 text-[#785616]" />
            <span className="text-sm font-semibold tracking-wide text-[#26231f]">{item.label}</span>
          </button>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-[0.24em] text-[#57534c]">FREQUENTLY ASKED QUESTIONS</h3>
        <div className="overflow-hidden rounded-xl border border-[#dedbd4] bg-white">
          {faqs.map((q, i) => (
            <button
              key={i}
              className={`w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#ffffff] transition-colors ${i > 0 ? "border-t border-[#dedbd4]" : ""}`}
            >
              <span className="text-base text-[#26231f]">{q}</span>
              <ChevronRight className="w-4 h-4 text-[#57534c] flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
