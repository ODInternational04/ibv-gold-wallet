import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadProducts, money } from "@/lib/wallet-api";
import {
  Box,
  ChevronRight,
  CheckCircle2,
  Clock,
  Info,
  Mail,
  PackageCheck,
  Scale,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

/* ─── Mock redemption history ────────────────────────── */
const redemptionHistory = [
  {
    id: "IBV-2026-0041",
    product: "2025 1oz Gold Krugerrand",
    date: "08 May 2026",
    status: "PENDING",
    value: "R 81,950.00",
    image: "/kr-1oz.jpg",
  },
  {
    id: "IBV-2026-0038",
    product: "2025 ½oz Gold Krugerrand",
    date: "02 May 2026",
    status: "APPROVED",
    value: "R 43,200.00",
    image: "/kr-half.jpg",
  },
  {
    id: "IBV-2026-0031",
    product: "2025 ¼oz Gold Krugerrand",
    date: "14 Apr 2026",
    status: "DELIVERED",
    value: "R 22,500.00",
    image: "/kr-quarter.jpg",
  },
];

const statusConfig = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border border-amber-800/40",
    icon: Clock,
    dot: "bg-amber-400",
    description: "Awaiting balance validation and vault release approval.",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-sky-50 text-sky-700 border border-sky-800/40",
    icon: CheckCircle2,
    dot: "bg-sky-400",
    description: "Vault release approved. Preparing for dispatch.",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-800/40",
    icon: Truck,
    dot: "bg-emerald-400",
    description: "Physical stock delivered successfully.",
  },
};

/* ─── Balance dialog sub-component ───────────────────── */
function BalanceDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#dedbd4] bg-[#ffffff] px-4 py-3 text-base font-medium text-[#57534c] transition-all hover:border-[#dedbd4] hover:bg-[#ffffff]"
      >
        <Wallet className="h-4 w-4" />
        View balance
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl border border-[#dedbd4] bg-white p-0 text-[#26231f] shadow-[0_28px_80px_rgba(38,35,31,0.06)]">
          <DialogHeader className="border-b border-[#dedbd4] px-6 py-5 text-left">
            <DialogTitle
              className="text-2xl font-semibold text-[#26231f]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Balance Summary
            </DialogTitle>
            <DialogDescription className="text-[#57534c]">
              Your current redeemable position and vault settlement details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Holdings", value: "0.000,000 oz" },
                { label: "Redeemable value", value: "ZAR 0.00" },
                { label: "Pending requests", value: "3" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-[#dedbd4] bg-[#ffffff] p-4 backdrop-blur-sm"
                >
                  <p className="text-sm tracking-[0.18em] text-[#57534c]">
                    {item.label.toUpperCase()}
                  </p>
                  <p
                    className="mt-2 text-2xl font-semibold text-[#26231f]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[#dedbd4] bg-[#ffffff] p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-[#ffffff] p-2">
                  <ShieldCheck className="h-4 w-4 text-[#57534c]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[#26231f]">
                    Redemption rules
                  </p>
                  <p className="mt-1 text-base leading-6 text-[#57534c]">
                    Physical redemption uses available wallet balance, then
                    applies fabrication and delivery fees before the request is
                    released from vault stock.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2 rounded-xl border border-[#dedbd4] bg-[#ffffff] p-4 backdrop-blur-sm">
              {[
                ["Vault allocation", "0.000,000 oz"],
                ["Available for redemption", "0.000,000 oz"],
                ["Settlement currency", "ZAR"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between text-base text-[#57534c]"
                >
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Stock badge ─────────────────────────────────────── */
function StockBadge({ stock }) {
  if (stock === "In stock")
    return (
      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-medium text-emerald-700">
        In stock
      </span>
    );
  if (stock === "Low stock")
    return (
      <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-sm font-medium text-amber-700">
        Low stock
      </span>
    );
  return (
    <span className="shrink-0 rounded-full bg-[#f7f5f0] px-2.5 py-0.5 text-sm font-medium text-[#57534c]">
      {stock}
    </span>
  );
}

/* ─── Main component ──────────────────────────────────── */
export default function GoldVault() {
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const catalog = useQuery({
    queryKey: ["products", "catalog"],
    queryFn: () => loadProducts(),
    refetchInterval: 15000,
  });
  const redeemProducts = (catalog.data ?? [])
    .filter((p) => p.redemption_value_cents != null)
    .map((p) => {
      const feeCents = { 0.1: 12000, 0.25: 18000, 0.5: 22000, 1: 28000 }[
        String(Number(p.oz_amount))
      ];
      return {
        id: p.id,
        name: p.name,
        type: p.category + " redemption",
        stock: "Available",
        weight: p.weight_label,
        fee:
          feeCents == null
            ? "Delivery quoted separately"
            : money(feeCents) + " insured delivery",
        feeAmount:
          feeCents == null ? "Quoted before approval" : money(feeCents),
        value: money(p.redemption_value_cents),
        image: p.image_url,
        total:
          feeCents == null
            ? "Quoted before approval"
            : money(Number(p.redemption_value_cents) + feeCents),
      };
    });
  const selectedProduct =
    redeemProducts.find((p) => p.id === selectedProductId) ?? redeemProducts[0];

  function handleConfirm() {
    setSubmitted(true);
    setTimeout(() => {
      setConfirmOpen(false);
      setSubmitted(false);
      setAddress("");
    }, 1800);
  }

  if (catalog.isPending)
    return (
      <div role="status" className="rounded-xl border p-8 text-[#57534c]">
        Loading redemption values…
      </div>
    );
  if (catalog.error)
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"
      >
        Unable to load redemption values.{" "}
        <button className="underline" onClick={() => catalog.refetch()}>
          Try again
        </button>
      </div>
    );
  if (!selectedProduct)
    return (
      <div className="rounded-xl border p-8">
        <h2 className="text-2xl text-[#26231f]">Redeem physical stock</h2>
        <p className="mt-3 text-[#57534c]">
          No products are currently available for redemption. Please check back
          once redemption values are published.
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-5 min-[900px]:flex-row">
      {/* ── Left ─────────────────────────────────────── */}
      <div className="flex-1 space-y-5">
        <div className="overflow-hidden rounded-[28px] border border-[#dedbd4] bg-[#ffffff] shadow-[0_26px_70px_rgba(38,35,31,0.06)]">
          {/* Header */}
          <div
            className="relative overflow-hidden px-5 py-7 sm:px-7"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #faf8f3 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #92702b 0, #92702b 1px, transparent 0, transparent 50%)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#faf3e3] px-2 py-0.5 text-sm font-semibold tracking-[0.22em] text-[#785616]">
                    AU
                  </span>
                  <Scale className="h-3.5 w-3.5 text-[#57534c]" />
                  <span className="text-sm font-bold tracking-[0.3em] text-[#57534c]">
                    REDEEM
                  </span>
                </div>
                <BalanceDialog />
              </div>
              <h2
                className="text-3xl font-semibold leading-[1.2] text-[#26231f]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Redeem physical stock
                <br />
                <em className="not-italic text-[#785616]">from your balance</em>
              </h2>
              <p className="text-base leading-7 text-[#57534c]">
                Use your vaulted balance to request bars or Krugerrands for
                physical delivery. Balance details remain available at any time.
              </p>
            </div>
          </div>

          {/* Product grid */}
          <div className="grid gap-4 p-4 sm:p-6 sm:grid-cols-2">
            {redeemProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={`overflow-hidden rounded-[22px] border text-left transition-all duration-200 ${
                  selectedProduct.id === product.id
                    ? "border-[#b48a3c] bg-[#fffaf0] shadow-[0_12px_36px_rgba(38,35,31,0.06)]"
                    : "border-[#dedbd4] bg-[#ffffff] hover:border-[#dedbd4] hover:bg-[#ffffff]"
                }`}
              >
                <div className="relative aspect-[16/9] overflow-hidden rounded-t-[22px] border-b border-[#dedbd4] bg-white p-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full rounded-2xl object-contain"
                  />
                  <div className="absolute right-2 top-2">
                    <StockBadge stock={product.stock} />
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p
                      className="text-base font-semibold text-[#26231f]"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                      }}
                    >
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-sm tracking-wide text-[#57534c]">
                      {product.type} · {product.weight}
                    </p>
                  </div>
                  <p
                    className="text-xl font-semibold text-[#26231f]"
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                    }}
                  >
                    {product.value}
                  </p>
                  <div className="flex items-center justify-between text-sm text-[#57534c]">
                    <span>{product.fee}</span>
                    <span
                      className={`flex items-center gap-1 transition-colors ${selectedProduct.id === product.id ? "text-[#785616]" : "text-[#57534c]"}`}
                    >
                      Select <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right ────────────────────────────────────── */}
      <div className="w-full min-[900px]:w-72 min-[900px]:flex-shrink-0 min-[900px]:sticky min-[900px]:top-4 min-[900px]:self-start">
        <div className="space-y-5">
          {/* Selected panel */}
          <div className="overflow-hidden rounded-[28px] border border-[#dedbd4] bg-[#ffffff] shadow-[0_24px_60px_rgba(38,35,31,0.06)]">
            <div className="border-b border-[#dedbd4] px-5 py-4">
              <p className="text-sm font-semibold tracking-[0.28em] text-[#57534c]">
                SELECTED REDEMPTION
              </p>
              <h3
                className="mt-2 text-3xl font-semibold text-[#26231f]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {selectedProduct.name}
              </h3>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="rounded-[22px] border border-[#dedbd4] bg-white p-4">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="h-40 w-full rounded-2xl object-contain"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#e3e0da] bg-[#f7f5f0] p-3">
                  <p className="text-sm tracking-[0.18em] text-[#57534c]">
                    WEIGHT
                  </p>
                  <p className="mt-1.5 text-base font-medium text-[#26231f]">
                    {selectedProduct.weight}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e3e0da] bg-[#f7f5f0] p-3">
                  <p className="text-sm tracking-[0.18em] text-[#57534c]">
                    AVAILABILITY
                  </p>
                  <p className="mt-1.5 text-base font-medium text-[#26231f]">
                    {selectedProduct.stock}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#dedbd4] bg-[#faf3e3] p-4">
                <p className="text-sm tracking-[0.22em] text-[#785616]">
                  REDEMPTION VALUE
                </p>
                <p
                  className="mt-1 text-3xl font-semibold text-[#26231f]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {selectedProduct.value}
                </p>
                <p className="mt-2 text-sm leading-5 text-[#57534c]">
                  {selectedProduct.fee}. Balance validated before vault release
                  is issued.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#e3e0da] bg-[#f7f5f0] p-4">
                <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#785616]" />
                <p className="text-sm leading-6 text-[#57534c]">
                  Choose a product, confirm your balance, and submit a delivery
                  request for physical stock from vault inventory.
                </p>
              </div>

              {/* CTA — opens confirmation modal */}
              <button
                onClick={() => setConfirmOpen(true)}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#21734e] px-6 py-4 text-base font-semibold text-white transition-all hover:bg-[#21734e] active:scale-[0.98]"
              >
                Redeem {selectedProduct.name}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <p className="text-center text-sm leading-5 text-[#57534c]">
                Confirmation will check your available wallet balance before
                releasing stock.
              </p>
            </div>
          </div>

          {/* Redemption history */}
          <div className="overflow-hidden rounded-[22px] border border-[#dedbd4] bg-[#ffffff]">
            <div className="flex items-center justify-between border-b border-[#e3e0da] px-5 py-4">
              <h3
                className="text-base font-semibold text-[#26231f]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Redemption History
              </h3>
              <button className="flex items-center gap-1.5 text-[#57534c] transition-colors hover:text-[#57534c]">
                <span className="text-sm">export CSV</span>
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[#faf3e3]">
                  <Mail className="h-3 w-3 text-[#785616]" />
                </div>
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {redemptionHistory.map((entry) => {
                const cfg = statusConfig[entry.status];
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 px-5 py-4"
                  >
                    <div className="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#dedbd4] bg-white p-1">
                      <img
                        src={entry.image}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-base font-medium text-[#26231f]">
                          {entry.product}
                        </p>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-semibold ${cfg.className}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                          />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-[#57534c]">
                        <span>{entry.id}</span>
                        <span>·</span>
                        <span>{entry.date}</span>
                      </div>
                      <p className="mt-1 text-sm text-[#57534c]">
                        {cfg.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#e3e0da] px-5 py-3">
              <div className="flex items-start gap-2">
                <Box className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#57534c]" />
                <p className="text-sm leading-5 text-[#57534c]">
                  Typical delivery: 3–7 business days after vault release
                  approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirmation Modal ────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md border border-[#dedbd4] bg-white p-0 text-[#26231f] shadow-[0_28px_80px_rgba(38,35,31,0.06)]">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 px-8 py-14">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-700/30">
                <CheckCircle2 className="h-7 w-7 text-emerald-700" />
              </div>
              <div className="text-center">
                <p
                  className="text-2xl font-semibold text-[#26231f]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Request submitted
                </p>
                <p className="mt-2 text-base leading-6 text-[#57534c]">
                  Your redemption request is pending balance validation and
                  vault release.
                </p>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="border-b border-[#dedbd4] px-6 py-5 text-left">
                <DialogTitle
                  className="text-2xl font-semibold text-[#26231f]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Confirm Redemption
                </DialogTitle>
                <DialogDescription className="text-[#57534c]">
                  Review details before submitting your physical stock request.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 px-6 py-5">
                {/* Product */}
                <div className="flex items-center gap-4 rounded-xl border border-[#dedbd4] bg-[#ffffff] p-4 backdrop-blur-sm">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#dedbd4] bg-white p-1.5">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p
                      className="text-xl font-semibold text-[#26231f]"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                      }}
                    >
                      {selectedProduct.name}
                    </p>
                    <p className="text-sm text-[#57534c]">
                      {selectedProduct.type} · {selectedProduct.weight}
                    </p>
                  </div>
                </div>

                {/* Fee breakdown */}
                <div className="overflow-hidden rounded-xl border border-[#dedbd4]">
                  <div className="flex items-center justify-between bg-[#ffffff] px-4 py-3 text-base">
                    <span className="text-[#57534c]">Redemption value</span>
                    <span className="font-medium text-[#26231f]">
                      {selectedProduct.value}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#dedbd4] bg-[#ffffff] px-4 py-3 text-base">
                    <span className="text-[#57534c]">
                      Handling &amp; delivery
                    </span>
                    <span className="text-[#57534c]">
                      {selectedProduct.feeAmount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#dedbd4] bg-[#faf3e3] px-4 py-3 text-base">
                    <span className="font-semibold text-[#785616]">
                      Total deducted
                    </span>
                    <span className="font-semibold text-[#26231f]">
                      {selectedProduct.total}
                    </span>
                  </div>
                </div>

                {/* Delivery address */}
                <div>
                  <label className="mb-2 block text-sm font-semibold tracking-[0.22em] text-[#57534c]">
                    DELIVERY ADDRESS
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address, city, postal code…"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[#dedbd4] bg-[#ffffff] px-4 py-3 text-base text-[#26231f] placeholder:text-[#57534c] outline-none transition-colors focus:border-[#dedbd4] focus:bg-[#ffffff]"
                  />
                </div>

                {/* Notice */}
                <div className="flex items-start gap-2 rounded-xl border border-[#dedbd4] bg-[#ffffff] px-4 py-3">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#57534c]" />
                  <p className="text-sm leading-5 text-[#57534c]">
                    Balance will be validated before vault release is issued.
                    This action cannot be reversed once approved.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <DialogClose asChild>
                    <button className="flex-1 rounded-xl border border-[#dedbd4] bg-[#ffffff] py-3 text-base font-medium text-[#57534c] transition-colors hover:bg-[#ffffff]">
                      Cancel
                    </button>
                  </DialogClose>
                  <button
                    onClick={handleConfirm}
                    disabled={!address.trim()}
                    className="flex-1 rounded-xl bg-[#21734e] py-3 text-base font-semibold text-white transition-all hover:bg-[#21734e] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Confirm Redemption
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
