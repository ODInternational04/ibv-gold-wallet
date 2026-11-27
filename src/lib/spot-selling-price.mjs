// oz_amount represents fine gold content, including for alloyed Krugerrands.
export function spotSellingPrice(spotZarPerOz, ounces) {
  const weight = Number(ounces);
  if (!Number.isFinite(spotZarPerOz) || spotZarPerOz <= 0)
    throw new Error("A valid current spot price is required.");
  if (!Number.isFinite(weight) || weight <= 0)
    throw new Error("Enter a positive gold weight in troy ounces first.");
  const cents = Math.round(spotZarPerOz * weight * 100);
  if (!Number.isSafeInteger(cents) || cents < 1 || cents > 10000000000)
    throw new Error(
      "The generated price must be between R0.01 and R100,000,000.",
    );
  return (cents / 100).toFixed(2);
}
