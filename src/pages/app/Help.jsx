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
        <HelpCircle className="w-4 h-4 text-[#396978]/75" />
        <h2 className="text-xl font-light text-[#22303a]/85" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Help Center</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: MessageCircle, label: "Live Chat" },
          { icon: Mail, label: "Email Us" },
          { icon: Book, label: "FAQs" },
        ].map((item) => (
          <button key={item.label} className="flex flex-col items-center gap-2 rounded-xl border border-[#e5dfd5] bg-white p-5 transition-colors hover:bg-[#f5f0e8]">
            <item.icon className="w-6 h-6 text-[#C9A84C]" />
            <span className="text-xs font-semibold tracking-wide text-[#22303a]/70">{item.label}</span>
          </button>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-[10px] font-semibold tracking-[0.24em] text-[#8d979d]">FREQUENTLY ASKED QUESTIONS</h3>
        <div className="overflow-hidden rounded-xl border border-[#e5dfd5] bg-white">
          {faqs.map((q, i) => (
            <button
              key={i}
              className={`w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#f5f0e8] transition-colors ${i > 0 ? "border-t border-[#f0ece4]" : ""}`}
            >
              <span className="text-sm text-[#22303a]/80">{q}</span>
              <ChevronRight className="w-4 h-4 text-[#b0bcc5] flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
