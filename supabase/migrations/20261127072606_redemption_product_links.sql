begin;
-- Different typographic spellings must not detach historic gold from its product.
create function wallet_private.product_match_key(p_name text) returns text
language sql immutable set search_path='' as $$
  select regexp_replace(replace(replace(replace(replace(replace(lower(btrim(p_name)),
    '¼','1/4'),'½','1/2'),'¾','3/4'),'⁄','/'),chr(160),' '),'\s+',' ','g');
$$;
revoke all on function wallet_private.product_match_key(text) from public,anon,authenticated;

alter table public.transactions add column product_id uuid references public.products(id);
alter table public.transactions add column product_unit_oz numeric(12,6) check(product_unit_oz>0);
create index transactions_product_id on public.transactions(product_id);

-- Modern paid orders contain authoritative product and unit-weight snapshots.
update public.transactions t set product_id=o.product_id,product_unit_oz=o.oz_amount
from public.payment_orders o where o.transaction_id=t.id and o.user_id=t.user_id and o.status='paid';
-- Only link legacy names when their normalized spelling identifies one product.
with unique_names as (
  select wallet_private.product_match_key(name) as match_key,min(id::text)::uuid as id
  from public.products group by wallet_private.product_match_key(name) having count(*)=1
)
update public.transactions t set product_id=p.id,product_unit_oz=p.oz_amount
from unique_names n join public.products p on p.id=n.id
where t.product_id is null and wallet_private.product_match_key(t.product_name)=n.match_key;

create or replace function wallet_private.redemption_summary() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_summary jsonb;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  with unique_names as (
    select wallet_private.product_match_key(name) as match_key,min(id::text)::uuid as id
    from public.products group by wallet_private.product_match_key(name) having count(*)=1
  ), valued as (
    select t.product_name,t.oz_amount,p.redemption_value_cents,
      coalesce(t.product_unit_oz,o.oz_amount,p.oz_amount) as unit_oz
    from public.transactions t
    left join public.payment_orders o on o.transaction_id=t.id and o.user_id=t.user_id and o.status='paid'
    left join unique_names n on t.product_id is null and o.id is null
      and n.match_key=wallet_private.product_match_key(t.product_name)
    left join public.products p on p.id=coalesce(t.product_id,o.product_id,n.id)
    where t.user_id=v_user and t.status='completed'
  )
  select jsonb_build_object(
    'total_oz',coalesce(sum(oz_amount),0),
    'redeemable_cents',case when count(*) filter(where redemption_value_cents is null or unit_oz is null or unit_oz<=0)>0 then null
      else round(coalesce(sum(redemption_value_cents*oz_amount/nullif(unit_oz,0)),0)) end,
    'missing_prices',count(*) filter(where redemption_value_cents is null or unit_oz is null or unit_oz<=0),
    'unpriced_products',coalesce(jsonb_agg(distinct product_name) filter(where redemption_value_cents is null or unit_oz is null or unit_oz<=0),'[]'::jsonb),
    'currency','ZAR','valuation_basis','admin_redemption'
  ) into v_summary from valued;
  return v_summary;
end;
$$;
notify pgrst,'reload schema';
commit;
