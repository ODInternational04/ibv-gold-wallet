begin;
create function wallet_private.redemption_summary() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_summary jsonb;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  with unique_names as (
    select name,min(id::text)::uuid as id from public.products group by name having count(*)=1
  ), valued as (
    select t.product_name,t.oz_amount,p.redemption_value_cents,
      coalesce(o.oz_amount,p.oz_amount) as unit_oz
    from public.transactions t
    left join public.payment_orders o on o.transaction_id=t.id and o.user_id=t.user_id and o.status='paid'
    left join unique_names n on o.id is null and n.name=t.product_name
    left join public.products p on p.id=coalesce(o.product_id,n.id)
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
-- This privileged implementation reads only the authenticated customer's holdings.
-- It can value owned products even when they are hidden from the sales catalog.
revoke all on function wallet_private.redemption_summary() from public,anon;
grant execute on function wallet_private.redemption_summary() to authenticated;
create function public.redemption_summary() returns jsonb
language sql security invoker set search_path='' as $$ select wallet_private.redemption_summary(); $$;
revoke all on function public.redemption_summary() from public,anon;
grant execute on function public.redemption_summary() to authenticated;
notify pgrst,'reload schema';
commit;
