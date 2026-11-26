// PayFast sandbox credentials — replace with live credentials for production
const PAYFAST_SANDBOX_MERCHANT_ID = "10000100";
const PAYFAST_SANDBOX_MERCHANT_KEY = "46f0cd694581a";
const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";

/**
 * Redirects the user to the PayFast sandbox checkout page.
 * @param {object} options
 * @param {string} options.itemName   - Product name shown on PayFast
 * @param {string} options.amount     - Amount as a raw price string e.g. "R 9,400.00"
 * @param {number} options.ozAmount   - Gold weight in troy oz e.g. 0.1
 * @param {string} [options.email]    - Buyer email to pre-fill on PayFast
 */
export function redirectToPayFast({ itemName, amount, ozAmount, email }) {
  // Parse "R 9,400.00" → "9400.00"
  const numericAmount = parseFloat(
    amount.replace(/[^\d.]/g, "")
  ).toFixed(2);

  // Store pending transaction in sessionStorage so Dashboard can record it on return
  sessionStorage.setItem('pendingTx', JSON.stringify({
    productName: itemName,
    ozAmount,
    purchasePriceZar: parseFloat(numericAmount),
  }));

  const origin = window.location.origin;

  const fields = {
    merchant_id: PAYFAST_SANDBOX_MERCHANT_ID,
    merchant_key: PAYFAST_SANDBOX_MERCHANT_KEY,
    return_url: `${origin}/app/dashboard?payment=success`,
    cancel_url: `${origin}/app/transact?payment=cancelled`,
    notify_url: `${origin}/api/payfast/notify`, // ITN endpoint — wire up server-side later
    email_address: email ?? "",
    amount: numericAmount,
    item_name: itemName,
  };

  // Build and auto-submit a hidden form (PayFast requires POST)
  const form = document.createElement("form");
  form.method = "POST";
  form.action = PAYFAST_SANDBOX_URL;
  form.style.display = "none";

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
