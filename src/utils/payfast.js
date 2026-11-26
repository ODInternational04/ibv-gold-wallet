import { supabase } from "@/utils/supabase/client";

// Checkout amounts and signatures are generated on the server from the catalog.
export async function redirectToPayFast({
  productId,
  expectedPriceCents,
  requestKey,
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token)
    throw new Error("Please sign in again before checking out.");
  const response = await fetch("/api/payfast/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.access_token,
    },
    body: JSON.stringify({ productId, expectedPriceCents, requestKey }),
  });
  let checkout;
  try {
    checkout = await response.json();
  } catch {
    throw new Error(
      "The payment service is not available. Please try again later.",
    );
  }
  if (!response.ok)
    throw new Error(checkout.error || "Unable to start checkout.");
  const allowed = [
    "https://www.payfast.co.za/eng/process",
    "https://sandbox.payfast.co.za/eng/process",
  ];
  if (!allowed.includes(checkout.action) || !checkout.fields)
    throw new Error("Invalid payment destination.");
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkout.action;
  form.style.display = "none";
  Object.entries(checkout.fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}
