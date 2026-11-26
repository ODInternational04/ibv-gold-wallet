import { supabase } from "@/utils/supabase/client";

export const money = (cents = 0) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(
    Number(cents) / 100,
  );
export const dateTime = (value) =>
  new Date(value).toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    dateStyle: "medium",
    timeStyle: "short",
  });
export function toCents(value) {
  if (!/^\d+(\.\d{1,2})?$/.test(String(value)))
    throw new Error("Enter an amount with up to two decimal places.");
  const cents = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0)
    throw new Error("Enter a valid positive amount.");
  return cents;
}
export async function result(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}
export const rpc = (name, args = {}) => result(supabase.rpc(name, args));
export const loadProducts = (admin = false) =>
  result(
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true })
      .match(admin ? {} : { active: true }),
  );
export const loadWithdrawals = ({ userId, status = "all", page = 0 } = {}) => {
  let query = supabase
    .from("withdrawal_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .range(page * 25, page * 25 + 24);
  if (userId) query = query.eq("user_id", userId);
  if (status !== "all") query = query.eq("status", status);
  return result(query);
};
export async function uploadProductImage(file) {
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  if (!extensions[file.type] || file.size > 5 * 1024 * 1024)
    throw new Error("Choose a JPG, PNG or WebP image under 5 MB.");
  const path = `${crypto.randomUUID()}.${extensions[file.type]}`;
  await result(
    supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type, upsert: false }),
  );
  return {
    path,
    url: supabase.storage.from("product-images").getPublicUrl(path).data
      .publicUrl,
  };
}
