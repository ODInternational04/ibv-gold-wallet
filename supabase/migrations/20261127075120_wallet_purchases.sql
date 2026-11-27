begin;
create function wallet_private.wallet_purchases(p_page integer,p_search text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_result jsonb;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  if coalesce(p_page,0)<0 or coalesce(p_page,0)>100000 or length(coalesce(p_search,''))>160 then raise exception 'Invalid purchase search'; end if;
  with unique_names as (
    select wallet_private.product_match_key(name) as match_key,min(id::text)::uuid as id
    from public.products group by wallet_private.product_match_key(name) having count(*)=1
  ), owned as (
    select t.id,t.product_name,t.oz_amount,t.purchase_price_zar,t.created_at,p.name as current_name,p.sku,p.image_url,
      t.oz_amount/nullif(coalesce(t.product_unit_oz,o.oz_amount,p.oz_amount),0) as units,
      round(p.redemption_value_cents*t.oz_amount/nullif(coalesce(t.product_unit_oz,o.oz_amount,p.oz_amount),0)) as redemption_cents
    from public.transactions t
    left join public.payment_orders o on o.transaction_id=t.id and o.user_id=t.user_id and o.status='paid'
    left join unique_names n on t.product_id is null and o.id is null and n.match_key=wallet_private.product_match_key(t.product_name)
    left join public.products p on p.id=coalesce(t.product_id,o.product_id,n.id)
    where t.user_id=v_user and t.status='completed'
  ), filtered as (
    select * from owned where coalesce(trim(p_search),'')='' or
      position(wallet_private.product_match_key(p_search) in wallet_private.product_match_key(product_name||' '||coalesce(current_name,'')||' '||coalesce(sku,'')))>0
  ), paged as (
    select * from filtered order by created_at desc,id desc limit 25 offset coalesce(p_page,0)*25
  )
  select jsonb_build_object(
    'purchase_count',(select count(*) from owned),
    'purchase_total_cents',(select round(coalesce(sum(purchase_price_zar),0)*100) from owned),
    'total_oz',(select coalesce(sum(oz_amount),0) from owned),
    'match_count',(select count(*) from filtered),
    'purchases',(select coalesce(jsonb_agg(jsonb_build_object(
      'id',id,'product_name',product_name,'sku',sku,'image_url',image_url,
      'oz_amount',oz_amount,'units',units,'purchase_cents',round(purchase_price_zar*100),
      'redemption_cents',redemption_cents,'created_at',created_at
    ) order by created_at desc,id desc),'[]'::jsonb) from paged)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function wallet_private.wallet_purchases(integer,text) from public,anon;
grant execute on function wallet_private.wallet_purchases(integer,text) to authenticated;
create function public.wallet_purchases(p_page integer default 0,p_search text default '') returns jsonb
language sql security invoker set search_path='' as $$ select wallet_private.wallet_purchases(p_page,p_search); $$;
revoke all on function public.wallet_purchases(integer,text) from public,anon;
grant execute on function public.wallet_purchases(integer,text) to authenticated;
notify pgrst,'reload schema';
commit;
