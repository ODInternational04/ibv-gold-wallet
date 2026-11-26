-- IBV Gold admin backend. Requires the existing user_roles and user_verifications tables.
-- Run as database owner. This script is transactional; existing balances are never reset.
begin;
alter function public.update_updated_at() set search_path = '';
-- Completed purchases must come from a trusted payment confirmation, not a browser redirect.
revoke insert, update, delete on public.transactions from anon, authenticated;
drop policy if exists "Users can insert own transactions" on public.transactions;
create schema if not exists wallet_private;
revoke all on schema wallet_private from public, anon;
grant usage on schema wallet_private to authenticated;

create or replace function wallet_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'
  );
$$;
revoke all on function wallet_private.is_admin() from public, anon;
grant execute on function wallet_private.is_admin() to authenticated;

-- Remove recursive role policies. Only the database owner can assign admin roles.
drop policy if exists "Admins can read all roles" on public.user_roles;
drop policy if exists "Admins can update roles" on public.user_roles;
create policy "Wallet admins read roles" on public.user_roles for select to authenticated
using (wallet_private.is_admin());
revoke insert, update, delete on public.user_roles from anon, authenticated;

-- A customer's document submission must never approve its own identity.
create or replace function wallet_private.guard_verification() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and not wallet_private.is_admin() then
    if new.user_id <> auth.uid() or new.status::text not in ('not_submitted', 'pending') then
      raise exception 'Only administrators can review identity verification';
    end if;
    if tg_op = 'UPDATE' and old.status::text not in ('not_submitted', 'rejected') then
      raise exception 'This verification is already under review';
    end if;
    new.reviewed_at := null;
    new.reviewer_notes := null;
  end if;
  return new;
end;
$$;
revoke all on function wallet_private.guard_verification() from public, anon, authenticated;
create trigger wallet_verification_guard before insert or update on public.user_verifications
for each row execute function wallet_private.guard_verification();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (length(trim(sku)) between 1 and 64),
  name text not null check (length(trim(name)) between 1 and 160),
  description text not null default '' check (length(description) <= 3000),
  category text not null default 'Coin' check (length(category) between 1 and 80),
  weight_label text not null check (length(weight_label) between 1 and 80),
  oz_amount numeric(12,6) not null check (oz_amount > 0),
  purity text not null default '916.7' check (length(purity) <= 40),
  price_cents bigint not null check (price_cents > 0 and price_cents <= 10000000000),
  image_url text not null default '' check (image_url = '' or image_url like '/%' or image_url like 'https://%'),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
grant select on public.products to anon, authenticated;
grant insert, update on public.products to authenticated;
create policy "Read active products" on public.products for select to anon, authenticated using (active);
create policy "Admins read all products" on public.products for select to authenticated using (wallet_private.is_admin());
create policy "Admins create products" on public.products for insert to authenticated with check (wallet_private.is_admin());
create policy "Admins update products" on public.products for update to authenticated using (wallet_private.is_admin()) with check (wallet_private.is_admin());
create trigger products_updated_at before update on public.products for each row execute function public.update_updated_at();

create table public.cash_accounts (
  user_id uuid primary key references auth.users(id),
  available_cents bigint not null default 0 check (available_cents >= 0),
  reserved_cents bigint not null default 0 check (reserved_cents >= 0),
  updated_at timestamptz not null default now()
);
create table public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  request_key uuid not null,
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 100000000),
  status text not null default 'requested' check (status in ('requested','approved','processing','paid','rejected','failed')),
  account_holder text not null check (length(trim(account_holder)) between 2 and 160),
  bank_name text not null check (length(trim(bank_name)) between 2 and 100),
  account_number text not null check (account_number ~ '^[0-9]{6,20}$'),
  branch_code text not null check (branch_code ~ '^[0-9]{6}$'),
  account_type text not null check (account_type in ('current','savings','transmission')),
  reviewer_notes text not null default '',
  payment_reference text,
  bank_verified_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, request_key)
);
create unique index withdrawal_paid_reference on public.withdrawal_requests(payment_reference) where status = 'paid';
create index withdrawal_user_created on public.withdrawal_requests(user_id, created_at desc);
create index withdrawal_status_created on public.withdrawal_requests(status, created_at desc);
create table public.cash_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  withdrawal_id uuid references public.withdrawal_requests(id),
  kind text not null check (kind in ('settled_credit','withdrawal_reserved','withdrawal_paid','withdrawal_released')),
  available_delta bigint not null,
  reserved_delta bigint not null,
  reference text,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create unique index cash_credit_reference on public.cash_ledger(reference) where kind = 'settled_credit';
create unique index cash_withdrawal_event on public.cash_ledger(withdrawal_id, kind) where withdrawal_id is not null;
create index cash_ledger_user_created on public.cash_ledger(user_id, created_at desc);
create table public.wallet_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  audience text not null check (audience in ('admin','customer')),
  title text not null,
  body text not null,
  withdrawal_id uuid references public.withdrawal_requests(id),
  created_at timestamptz not null default now(),
  check ((audience = 'admin' and user_id is null) or (audience = 'customer' and user_id is not null))
);
create index notifications_audience_created on public.wallet_notifications(audience, created_at desc);
create index notifications_user_created on public.wallet_notifications(user_id, created_at desc);
create table public.wallet_notification_reads (
  notification_id uuid not null references public.wallet_notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key(notification_id, user_id)
);
alter table public.cash_accounts enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.cash_ledger enable row level security;
alter table public.wallet_notifications enable row level security;
alter table public.wallet_notification_reads enable row level security;
revoke all on public.cash_accounts, public.withdrawal_requests, public.cash_ledger, public.wallet_notifications, public.wallet_notification_reads from anon, authenticated;
grant select on public.cash_accounts, public.withdrawal_requests, public.cash_ledger, public.wallet_notifications, public.wallet_notification_reads to authenticated;
grant insert on public.wallet_notification_reads to authenticated;
create policy "Read own or admin cash accounts" on public.cash_accounts for select to authenticated using (user_id = (select auth.uid()) or wallet_private.is_admin());
create policy "Read own or admin withdrawals" on public.withdrawal_requests for select to authenticated using (user_id = (select auth.uid()) or wallet_private.is_admin());
create policy "Read own or admin ledger" on public.cash_ledger for select to authenticated using (user_id = (select auth.uid()) or wallet_private.is_admin());
create policy "Read relevant notifications" on public.wallet_notifications for select to authenticated using (user_id = (select auth.uid()) or (audience = 'admin' and wallet_private.is_admin()));
create policy "Read own notification receipts" on public.wallet_notification_reads for select to authenticated using (user_id = (select auth.uid()));
create policy "Mark accessible notifications read" on public.wallet_notification_reads for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.wallet_notifications where id = notification_id)
);

create or replace function wallet_private.request_withdrawal(p_key uuid, p_amount bigint, p_holder text, p_bank text, p_account text, p_branch text, p_type text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_id uuid; v_account public.cash_accounts;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  if not exists (select 1 from public.user_verifications where user_id = v_user and status::text = 'verified') then raise exception 'Identity verification required'; end if;
  if p_key is null or p_amount is null or p_amount <= 0 or p_amount > 100000000 then raise exception 'Enter a valid withdrawal amount up to R1,000,000'; end if;
  -- Serialize retries before checking the idempotency key and account balance.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  select id into v_id from public.withdrawal_requests where user_id = v_user and request_key = p_key;
  if v_id is not null then return v_id; end if;
  select * into v_account from public.cash_accounts where user_id = v_user for update;
  if not found or v_account.available_cents < p_amount then raise exception 'Insufficient settled cash balance'; end if;
  insert into public.withdrawal_requests(user_id, request_key, amount_cents, account_holder, bank_name, account_number, branch_code, account_type)
  values(v_user, p_key, p_amount, trim(p_holder), trim(p_bank), p_account, p_branch, p_type) returning id into v_id;
  update public.cash_accounts set available_cents = available_cents - p_amount, reserved_cents = reserved_cents + p_amount, updated_at = now() where user_id = v_user;
  insert into public.cash_ledger(user_id, withdrawal_id, kind, available_delta, reserved_delta, actor_id)
  values(v_user, v_id, 'withdrawal_reserved', -p_amount, p_amount, v_user);
  insert into public.wallet_notifications(audience,title,body,withdrawal_id)
  values('admin','New withdrawal request','A customer requested R' || to_char(p_amount / 100.0, 'FM999999990.00') || '. Review the request and bank details.',v_id);
  return v_id;
end;
$$;

create or replace function wallet_private.review_withdrawal(p_id uuid, p_status text, p_notes text, p_reference text, p_confirmed boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_request public.withdrawal_requests;
begin
  if auth.uid() is null or not wallet_private.is_admin() then raise exception 'Administrator access required'; end if;
  select * into v_request from public.withdrawal_requests where id = p_id for update;
  if not found then raise exception 'Withdrawal not found'; end if;
  if not ((v_request.status = 'requested' and p_status in ('approved','rejected')) or
          (v_request.status = 'approved' and p_status in ('processing','rejected')) or
          (v_request.status = 'processing' and p_status in ('paid','failed'))) then raise exception 'Invalid status transition. Refresh the request.'; end if;
  if p_status in ('approved','paid','failed') and p_confirmed is distinct from true then raise exception 'Bank or payment confirmation required'; end if;
  if p_status in ('rejected','failed') and length(trim(coalesce(p_notes,''))) < 5 then raise exception 'Provide a reason (at least 5 characters)'; end if;
  if p_status = 'paid' and length(trim(coalesce(p_reference,''))) < 3 then raise exception 'A bank payment reference is required'; end if;
  if length(coalesce(p_notes,'')) > 2000 or length(coalesce(p_reference,'')) > 160 then raise exception 'Notes or reference too long'; end if;
  perform 1 from public.cash_accounts where user_id = v_request.user_id for update;
  if p_status = 'paid' then
    update public.cash_accounts set reserved_cents = reserved_cents - v_request.amount_cents, updated_at = now() where user_id = v_request.user_id;
    insert into public.cash_ledger(user_id,withdrawal_id,kind,available_delta,reserved_delta,actor_id,reference)
    values(v_request.user_id,p_id,'withdrawal_paid',0,-v_request.amount_cents,auth.uid(),trim(p_reference));
  elsif p_status in ('rejected','failed') then
    update public.cash_accounts set available_cents = available_cents + v_request.amount_cents, reserved_cents = reserved_cents - v_request.amount_cents, updated_at = now() where user_id = v_request.user_id;
    insert into public.cash_ledger(user_id,withdrawal_id,kind,available_delta,reserved_delta,actor_id)
    values(v_request.user_id,p_id,'withdrawal_released',v_request.amount_cents,-v_request.amount_cents,auth.uid());
  end if;
  update public.withdrawal_requests set status = p_status, reviewer_notes = trim(coalesce(p_notes,'')),
    payment_reference = case when p_status = 'paid' then trim(p_reference) else payment_reference end,
    bank_verified_by = case when p_status = 'approved' then auth.uid() else bank_verified_by end,
    reviewed_by = auth.uid(), updated_at = now() where id = p_id;
  insert into public.wallet_notifications(user_id,audience,title,body,withdrawal_id)
  values(v_request.user_id,'customer','Withdrawal ' || p_status,'Your R' || to_char(v_request.amount_cents / 100.0,'FM999999990.00') || ' withdrawal is ' || p_status || '.',p_id);
end;
$$;

create or replace function wallet_private.record_settled_credit(p_user uuid, p_amount bigint, p_reference text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not wallet_private.is_admin() then raise exception 'Administrator access required'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > 100000000 or length(trim(coalesce(p_reference,''))) not between 3 and 160 then raise exception 'Valid amount and unique settlement reference required'; end if;
  if not exists(select 1 from auth.users where id = p_user) then raise exception 'Customer not found'; end if;
  insert into public.cash_accounts(user_id) values(p_user) on conflict(user_id) do nothing;
  perform 1 from public.cash_accounts where user_id = p_user for update;
  insert into public.cash_ledger(user_id,kind,available_delta,reserved_delta,reference,actor_id)
  values(p_user,'settled_credit',p_amount,0,trim(p_reference),auth.uid());
  update public.cash_accounts set available_cents = available_cents + p_amount, updated_at = now() where user_id = p_user;
end;
$$;

create or replace function wallet_private.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not wallet_private.is_admin() then raise exception 'Administrator access required'; end if;
  return jsonb_build_object(
    'customers', (select count(*) from auth.users where deleted_at is null),
    'verified', (select count(*) from public.user_verifications where status::text = 'verified'),
    'verification_pending', (select count(*) from public.user_verifications where status::text in ('pending','under_review')),
    'active_products', (select count(*) from public.products where active),
    'pending_withdrawals', (select count(*) from public.withdrawal_requests where status in ('requested','approved','processing')),
    'pending_cents', (select coalesce(sum(amount_cents),0) from public.withdrawal_requests where status in ('requested','approved','processing')),
    'paid_cents', (select coalesce(sum(amount_cents),0) from public.withdrawal_requests where status = 'paid'),
    'available_cents', (select coalesce(sum(available_cents),0) from public.cash_accounts),
    'reserved_cents', (select coalesce(sum(reserved_cents),0) from public.cash_accounts),
    'settled_cents', (select coalesce(sum(available_delta),0) from public.cash_ledger where kind = 'settled_credit'),
    'weekly_requests', (select coalesce(jsonb_agg(x),'[]') from (
       select d::date as day, count(w.id) as requests, coalesce(sum(w.amount_cents),0) as cents
       from generate_series((now() at time zone 'Africa/Johannesburg')::date - 6,(now() at time zone 'Africa/Johannesburg')::date,interval '1 day') d
       left join public.withdrawal_requests w on (w.created_at at time zone 'Africa/Johannesburg')::date = d::date group by d order by d
    ) x)
  );
end;
$$;
create or replace function wallet_private.admin_customers(p_search text, p_offset integer)
returns table(user_id uuid,email text,created_at timestamptz,verification text,available_cents bigint,reserved_cents bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not wallet_private.is_admin() then raise exception 'Administrator access required'; end if;
  return query select u.id,u.email::text,u.created_at,coalesce(v.status::text,'not_submitted'),coalesce(a.available_cents,0),coalesce(a.reserved_cents,0)
  from auth.users u left join public.user_verifications v on v.user_id=u.id left join public.cash_accounts a on a.user_id=u.id
  where u.deleted_at is null and (coalesce(p_search,'') = '' or u.email ilike '%' || p_search || '%' or u.id::text = p_search)
  order by u.created_at desc limit 50 offset greatest(coalesce(p_offset,0),0);
end;
$$;

-- API functions are invokers; privileged implementations stay outside exposed schemas.
create function public.request_withdrawal(p_key uuid,p_amount bigint,p_holder text,p_bank text,p_account text,p_branch text,p_type text)
returns uuid language sql security invoker set search_path='' as $$ select wallet_private.request_withdrawal(p_key,p_amount,p_holder,p_bank,p_account,p_branch,p_type); $$;
create function public.review_withdrawal(p_id uuid,p_status text,p_notes text,p_reference text,p_confirmed boolean)
returns void language sql security invoker set search_path='' as $$ select wallet_private.review_withdrawal(p_id,p_status,p_notes,p_reference,p_confirmed); $$;
create function public.record_settled_credit(p_user uuid,p_amount bigint,p_reference text)
returns void language sql security invoker set search_path='' as $$ select wallet_private.record_settled_credit(p_user,p_amount,p_reference); $$;
create function public.admin_stats() returns jsonb language sql security invoker set search_path='' as $$ select wallet_private.admin_stats(); $$;
create function public.admin_customers(p_search text default '',p_offset integer default 0)
returns table(user_id uuid,email text,created_at timestamptz,verification text,available_cents bigint,reserved_cents bigint)
language sql security invoker set search_path='' as $$ select * from wallet_private.admin_customers(p_search,p_offset); $$;
revoke all on function wallet_private.request_withdrawal(uuid,bigint,text,text,text,text,text), wallet_private.review_withdrawal(uuid,text,text,text,boolean), wallet_private.record_settled_credit(uuid,bigint,text),wallet_private.admin_stats(),wallet_private.admin_customers(text,integer) from public,anon;
grant execute on function wallet_private.request_withdrawal(uuid,bigint,text,text,text,text,text), wallet_private.review_withdrawal(uuid,text,text,text,boolean), wallet_private.record_settled_credit(uuid,bigint,text),wallet_private.admin_stats(),wallet_private.admin_customers(text,integer) to authenticated;
revoke all on function public.request_withdrawal(uuid,bigint,text,text,text,text,text), public.review_withdrawal(uuid,text,text,text,boolean), public.record_settled_credit(uuid,bigint,text),public.admin_stats(),public.admin_customers(text,integer) from public,anon;
grant execute on function public.request_withdrawal(uuid,bigint,text,text,text,text,text), public.review_withdrawal(uuid,text,text,text,boolean), public.record_settled_credit(uuid,bigint,text),public.admin_stats(),public.admin_customers(text,integer) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "Admins upload product images" on storage.objects for insert to authenticated with check (bucket_id='product-images' and wallet_private.is_admin());
create policy "Admins read product images" on storage.objects for select to authenticated using (bucket_id='product-images' and wallet_private.is_admin());
create policy "Admins remove unused product images" on storage.objects for delete to authenticated using (bucket_id='product-images' and wallet_private.is_admin());

-- Preserve the existing catalog, initially available with the existing prices.
insert into public.products(sku,name,category,weight_label,oz_amount,purity,price_cents,image_url,description,active) values
('KR-2025-TENTH','2025 1/10oz Gold Krugerrand','Coin','1/10 oz',0.1,'916.7',940000,'/kr-tenth.jpg','SA Mint fractional Krugerrand.',true),
('KR-2025-QUARTER','2025 1/4oz Gold Krugerrand','Coin','1/4 oz',0.25,'916.7',2250000,'/kr-quarter.jpg','SA Mint quarter-ounce Krugerrand.',true),
('KR-2025-HALF','2025 1/2oz Gold Krugerrand','Coin','1/2 oz',0.5,'916.7',4320000,'/kr-half.jpg','SA Mint half-ounce Krugerrand.',true),
('KR-2025-ONE','2025 1oz Gold Krugerrand','Coin','1 oz',1,'916.7',8195000,'/kr-1oz.jpg','SA Mint full-ounce Krugerrand.',true);

notify pgrst, 'reload schema';
commit;
