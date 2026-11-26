import React, { useState } from "react";
import { ArrowLeftRight, ShoppingCart, TrendingDown, Upload, ArrowDown, ChevronRight, ShieldCheck, Sparkles, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { redirectToPayFast } from "@/utils/payfast";
import { useVerification } from "@/hooks/useVerification";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { loadProducts, money, result } from '@/lib/wallet-api';
import WithdrawalForm from '@/components/app/WithdrawalForm';


export default function Transact() {
  const [mode, setMode] = useState("buy");
  const [selected, setSelected] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [buying, setBuying] = useState(false);
  const queryClient = useQueryClient();
  const catalog = useQuery({ queryKey: ['products','catalog'], queryFn: () => loadProducts(), refetchInterval: 15000 });
  const goldProducts = (catalog.data ?? []).map(p => ({ ...p, weight: p.weight_label, ozAmount: Number(p.oz_amount), price: money(p.price_cents), image: p.image_url }));
  const selectedProduct = goldProducts.find((product) => product.id === selected) ?? goldProducts[0];
  const { user } = useAuth();
  const { isVerified, isPending } = useVerification();

  const handleBuy = async () => {
    if (!selectedProduct || buying) return;
    setBuying(true); setCheckoutError('');
    try {
      const current = await result(supabase.from('products').select('*').eq('id', selectedProduct.id).eq('active', true).single());
      if (Number(current.price_cents) !== Number(selectedProduct.price_cents)) {
        await queryClient.invalidateQueries({queryKey:['products']});
        throw new Error('The product price has changed. Review the new price before continuing.');
      }
      redirectToPayFast({ itemName: current.name, amount: (Number(current.price_cents)/100).toFixed(2), ozAmount: Number(current.oz_amount), email: user?.email });
    } catch (err) { setCheckoutError(err.message); }
    finally { setBuying(false); }
  };

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ArrowLeftRight className="w-4 h-4 text-[#57534c]" />
        <h2
          className="text-[#26231f] font-semibold text-xl"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >Transact</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6 sm:grid-cols-4">
        {[
          { key: "buy", label: "Buy", icon: ShoppingCart },
          { key: "sell", label: "Sell", icon: TrendingDown },
          { key: "upload", label: "Upload", icon: Upload },
          { key: "withdraw", label: "Withdraw", icon: ArrowDown },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setMode(item.key)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-colors ${mode === item.key ? "bg-[#faf3e3] text-[#785616] border border-[#d8bd83]" : "bg-[#ffffff] text-[#57534c] hover:text-[#26231f] border border-transparent"}`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {mode === "withdraw" ? <WithdrawalForm /> : mode === "buy" && catalog.isPending ? <p className="p-8 text-[#57534c]">Loading products…</p> : mode === "buy" && catalog.error ? <p role="alert" className="p-8 text-red-700">Unable to load the catalog: {catalog.error.message}</p> : mode === "buy" && !selectedProduct ? <p className="p-8 text-[#57534c]">No products are currently available.</p> : mode === "buy" ? (
        <>
          <div className="grid gap-5 min-[900px]:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.7fr)]">
            <section className="overflow-hidden rounded-[28px] border border-[#dedbd4] bg-[#ffffff] shadow-[0_24px_72px_rgba(38,35,31,0.06)]">
              <div className="relative overflow-hidden border-b border-[#e3e0da] px-5 py-6 sm:px-6"
                style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf8f3 100%)" }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: "repeating-linear-gradient(45deg, #92702b 0, #92702b 1px, transparent 0, transparent 50%)",
                    backgroundSize: "20px 20px",
                  }}
                />
                <div className="relative flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold tracking-[0.28em] text-[#57534c]">BUY PHYSICAL GOLD</p>
                    <div className="flex items-center gap-2 rounded-xl border border-[#dedbd4] bg-[#ffffff] px-3 py-2 text-sm text-[#57534c]">
                      <Sparkles className="h-3.5 w-3.5" />
                      Live catalog
                    </div>
                  </div>
                  <h3
                    className="text-3xl font-semibold text-[#26231f]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >Choose a vaulted product</h3>
                  <p className="text-base text-[#57534c]">Exchange-style buying with clear pricing, real product imagery, and one-tap selection.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 sm:grid-cols-2">
                {goldProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelected(product.id)}
                    className={`group overflow-hidden rounded-[22px] border text-left transition-all ${
                      selected === product.id
                        ? "border-[#b48a3c] bg-[#fffaf0] shadow-[0_12px_36px_rgba(38,35,31,0.06)]"
                        : "border-[#dedbd4] bg-[#ffffff] hover:border-[#dedbd4] hover:bg-[#ffffff]"
                    }`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-t-[22px] border-b border-[#dedbd4] bg-white p-4">
                      <img src={product.image} alt={product.name} className="h-full w-full rounded-2xl object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
                      <div className="absolute left-3 top-3 flex items-center gap-2">
                        <span className="rounded-full border border-[#dedbd4] bg-[#faf3e3] px-2.5 py-1 text-sm font-medium text-[#785616] backdrop-blur-sm">{product.category}</span>
                        {product.badge && (
                          <span className="rounded-full bg-[#faf3e3] px-2.5 py-1 text-sm font-semibold text-[#785616]">{product.badge}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-[#26231f]">{product.name}</p>
                          <p className="mt-1 text-sm text-[#57534c]">{product.weight} • {product.purity} fineness</p>
                        </div>
                        <div className={`mt-1 h-3 w-3 rounded-full border ${selected === product.id ? "border-[#dedbd4] bg-[#2d2a26]" : "border-[#e3e0da] bg-transparent"}`} />
                      </div>

                      <p className="text-base leading-6 text-[#57534c]">{product.description}</p>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-[#57534c]">Market price</p>
                          <p className="mt-1 text-lg font-semibold text-[#26231f]">{product.price}</p>
                        </div>
                        <span className="rounded-full border border-[#e3e0da] px-3 py-1.5 text-sm text-[#57534c]">Ready to buy</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <aside className="flex flex-col gap-4 min-[900px]:sticky min-[900px]:top-4 min-[900px]:self-start">
              <div className="overflow-hidden rounded-[28px] border border-[#dedbd4] bg-[#ffffff] shadow-[0_24px_60px_rgba(38,35,31,0.06)]">
                <div className="border-b border-[#dedbd4] px-5 py-4">
                  <p className="text-sm font-semibold tracking-[0.28em] text-[#57534c]">SELECTED ORDER</p>
                  <h3
                    className="mt-2 text-3xl font-semibold text-[#26231f]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >{selectedProduct.name}</h3>
                </div>

                <div className="space-y-4 px-5 py-5">
                  <div className="rounded-[22px] border border-[#dedbd4] bg-white p-4">
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="h-40 w-full rounded-2xl object-contain" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#e3e0da] bg-[#f7f5f0] p-3">
                      <p className="text-sm tracking-[0.18em] text-[#57534c]">WEIGHT</p>
                      <p className="mt-1.5 text-base font-medium text-[#26231f]">{selectedProduct.weight}</p>
                    </div>
                    <div className="rounded-xl border border-[#e3e0da] bg-[#f7f5f0] p-3">
                      <p className="text-sm tracking-[0.18em] text-[#57534c]">PURITY</p>
                      <p className="mt-1.5 text-base font-medium text-[#26231f]">{selectedProduct.purity}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#dedbd4] bg-[#faf3e3] p-4">
                    <p className="text-sm tracking-[0.22em] text-[#785616]">TOTAL DUE</p>
                    <p
                      className="mt-1 text-3xl font-semibold text-[#26231f]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >{selectedProduct.price}</p>
                    <p className="mt-2 text-sm leading-5 text-[#57534c]">Vaulted, insured and ready for settlement once identity verification is complete.</p>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-[#e3e0da] bg-[#f7f5f0] p-4">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#785616]" />
                    <div>
                      <p className="text-base font-semibold text-[#26231f]">Secure checkout</p>
                      <p className="mt-1 text-sm leading-5 text-[#57534c]">Order confirmation, proof of ownership and wallet settlement happen inside your verified account.</p>
                    </div>
                  </div>

                  {isVerified ? (
                    <button
                      onClick={handleBuy}
                      disabled={buying}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#21734e] px-6 py-4 text-base font-semibold text-white transition-all hover:bg-[#21734e] active:scale-[0.98]"
                    >
                      {buying ? 'Checking price…' : `Sandbox checkout · ${selectedProduct.name}`}
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                        <p className="text-sm leading-5 text-amber-700">
                          {isPending
                            ? "Your verification is under review. Buying will be unlocked once approved."
                            : "You must verify your identity before you can buy."}
                        </p>
                      </div>
                      {!isPending && (
                        <Link
                          to="/registration"
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#dedbd4] bg-[#ffffff] px-6 py-4 text-base font-semibold text-[#57534c] transition-all hover:bg-[#ffffff]"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Verify Identity to Unlock
                        </Link>
                      )}
                    </div>
                  )}

                  {checkoutError && <p role="alert" className="text-base text-red-700">{checkoutError}</p>}
                  <p className="text-center text-sm leading-5 text-[#57534c]">Checkout is in test mode. Sandbox payments do not create settled cash.</p>
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-[#dedbd4] bg-white px-4 py-12 text-center sm:p-6 sm:py-16">
          <p className="text-[#57534c] text-base">
            {mode === "sell" ? "Select gold from your vault to sell." : mode === "upload" ? "Upload funds to your wallet." : "Withdraw funds to your bank account."}
          </p>
          <p className="text-[#57534c] text-sm mt-4">You must verify your identity before transacting.</p>
        </div>
      )}
    </div>
  );
}
