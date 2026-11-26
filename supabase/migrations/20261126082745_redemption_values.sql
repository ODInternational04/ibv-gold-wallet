-- Admin-managed redemption quotes, separate from catalog purchase prices.
begin;
alter table public.products add column redemption_value_cents bigint
  check (redemption_value_cents > 0 and redemption_value_cents <= 10000000000);
-- Keep the existing displayed amounts when switching the vault to database quotes.
update public.products set redemption_value_cents = price_cents;
comment on column public.products.redemption_value_cents is
  'Admin-set ZAR redemption value in integer cents. Null means not offered for redemption.';
-- Existing product RLS permits only admins to write and only active products to be read by customers.
notify pgrst, 'reload schema';
commit;
