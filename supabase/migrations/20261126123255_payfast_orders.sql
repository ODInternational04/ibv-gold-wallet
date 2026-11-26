begin;
create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  product_id uuid not null references public.products(id),
  request_key uuid not null,
  product_name text not null,
  oz_amount numeric(12,6) not null check(oz_amount > 0),
  amount_cents bigint not null check(amount_cents > 0),
  payment_mode text not null check(payment_mode in('live','sandbox')),
  status text not null default 'pending' check(status in('pending','paid','sandbox_paid')),
  provider_payment_id text unique,
  transaction_id uuid unique references public.transactions(id),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique(user_id,request_key)
);
create index payment_orders_user_created on public.payment_orders(user_id,created_at desc);
alter table public.payment_orders enable row level security;
revoke all on public.payment_orders from public,anon,authenticated;
grant select on public.payment_orders to authenticated,service_role;
create policy "Read own or admin payment orders" on public.payment_orders for select to authenticated
using(user_id=(select auth.uid()) or wallet_private.is_admin());

create function wallet_private.create_payfast_order(p_product uuid,p_key uuid,p_expected bigint,p_mode text)
returns public.payment_orders language plpgsql security definer set search_path='' as $$
declare v_product public.products; v_order public.payment_orders; v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  if p_key is null or p_mode is null or p_mode not in('live','sandbox') then raise exception 'Invalid checkout request'; end if;
  if not exists(select 1 from public.user_verifications where user_id=v_user and status::text='verified') then raise exception 'Identity verification required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,1));
  select * into v_order from public.payment_orders where user_id=v_user and request_key=p_key;
  if found then
    if v_order.product_id<>p_product or v_order.payment_mode<>p_mode or v_order.amount_cents<>p_expected then raise exception 'Checkout retry does not match the original order'; end if;
    if v_order.status<>'pending' then raise exception 'This order has already been paid'; end if;
    if v_order.created_at<now()-interval '30 minutes' then raise exception 'Checkout expired. Start a new checkout.'; end if;
    return v_order;
  end if;
  if (select count(*) from public.payment_orders where user_id=v_user and created_at>now()-interval '10 minutes')>=10 then raise exception 'Too many checkout attempts. Try again shortly.'; end if;
  select * into v_product from public.products where id=p_product and active for share;
  if not found then raise exception 'Product is no longer available'; end if;
  if p_expected is null or v_product.price_cents<>p_expected then raise exception 'The price has changed. Review the updated catalog price.'; end if;
  insert into public.payment_orders(user_id,product_id,request_key,product_name,oz_amount,amount_cents,payment_mode)
  values(v_user,v_product.id,p_key,v_product.name,v_product.oz_amount,v_product.price_cents,p_mode)
  returning * into v_order;
  return v_order;
end;
$$;
create function public.create_payfast_order(p_product uuid,p_key uuid,p_expected bigint,p_mode text)
returns public.payment_orders language sql security invoker set search_path='' as $$ select wallet_private.create_payfast_order(p_product,p_key,p_expected,p_mode); $$;
revoke all on function wallet_private.create_payfast_order(uuid,uuid,bigint,text), public.create_payfast_order(uuid,uuid,bigint,text) from public,anon;
grant execute on function wallet_private.create_payfast_order(uuid,uuid,bigint,text), public.create_payfast_order(uuid,uuid,bigint,text) to authenticated;

-- Only the server can settle an order, after all PayFast notification checks pass.
create function wallet_private.settle_payfast_order(p_order uuid,p_payment text,p_amount bigint,p_mode text)
returns text language plpgsql security definer set search_path='' as $$
declare v_order public.payment_orders; v_tx uuid;
begin
  if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Trusted payment service required'; end if;
  if length(trim(coalesce(p_payment,''))) not between 1 and 100 then raise exception 'Invalid payment reference'; end if;
  select * into v_order from public.payment_orders where id=p_order for update;
  if not found then raise exception 'Order not found'; end if;
  if p_amount is null or p_amount<>v_order.amount_cents or p_mode is null or p_mode<>v_order.payment_mode then raise exception 'Payment does not match order'; end if;
  if v_order.status<>'pending' then
    if v_order.provider_payment_id=p_payment then return v_order.status; end if;
    raise exception 'Order was settled by a different payment';
  end if;
  if p_mode='live' then
    insert into public.transactions(user_id,product_name,oz_amount,purchase_price_zar,status)
    values(v_order.user_id,v_order.product_name,v_order.oz_amount,v_order.amount_cents/100.0,'completed') returning id into v_tx;
  end if;
  update public.payment_orders set status=case when p_mode='live' then 'paid' else 'sandbox_paid' end,
    provider_payment_id=p_payment,transaction_id=v_tx,paid_at=now() where id=p_order;
  insert into public.wallet_notifications(user_id,audience,title,body)
  values(v_order.user_id,'customer',case when p_mode='live' then 'Gold purchase confirmed' else 'Test payment confirmed' end,
    case when p_mode='live' then 'Your purchase of '||v_order.product_name||' has been confirmed and added to your gold holdings.' else 'Your sandbox payment was confirmed. No real gold or cash was credited.' end);
  return case when p_mode='live' then 'paid' else 'sandbox_paid' end;
end;
$$;
create function public.settle_payfast_order(p_order uuid,p_payment text,p_amount bigint,p_mode text)
returns text language sql security invoker set search_path='' as $$ select wallet_private.settle_payfast_order(p_order,p_payment,p_amount,p_mode); $$;
revoke all on function public.settle_payfast_order(uuid,text,bigint,text), wallet_private.settle_payfast_order(uuid,text,bigint,text) from public,anon,authenticated;
grant usage on schema wallet_private to service_role;
grant execute on function public.settle_payfast_order(uuid,text,bigint,text), wallet_private.settle_payfast_order(uuid,text,bigint,text) to service_role;
notify pgrst,'reload schema';
commit;
