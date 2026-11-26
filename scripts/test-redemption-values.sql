-- Redemption pricing integration checks. Fixture products and users are rolled back.
begin;
create temporary table redemption_test_ids as select gen_random_uuid() as admin_id,gen_random_uuid() as customer_id,gen_random_uuid() as product_id;
grant select on redemption_test_ids to authenticated;
insert into auth.users(id,email) select admin_id,'redemption-admin@example.invalid' from redemption_test_ids union all select customer_id,'redemption-customer@example.invalid' from redemption_test_ids;
insert into public.user_roles(user_id,role) select admin_id,'admin' from redemption_test_ids;
create function pg_temp.assert_redemption(value boolean,message text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'TEST FAILED: %',message; end if; end; $$;
select set_config('request.jwt.claim.sub',(select admin_id::text from redemption_test_ids),true);
set local role authenticated;
insert into public.products(id,sku,name,weight_label,oz_amount,price_cents,active)
select product_id,'REDEMPTION-TEST-'||product_id::text,'Redemption fixture','1 oz',1,200000,true from redemption_test_ids;
select pg_temp.assert_redemption((select redemption_value_cents is null from public.products where id=(select product_id from redemption_test_ids)),'new products require an explicit redemption quote');
update public.products set redemption_value_cents=123450 where id=(select product_id from redemption_test_ids);
select pg_temp.assert_redemption((select redemption_value_cents=123450 and price_cents=200000 from public.products where id=(select product_id from redemption_test_ids)),'admin redemption update preserves purchase price');
do $$ begin
  begin
    update public.products set redemption_value_cents=-100 where id=(select product_id from redemption_test_ids);
    raise exception 'TEST FAILED: negative redemption accepted';
  exception when check_violation then null; end;
end $$;
do $$ begin
  begin
    update public.products set redemption_value_cents=10000000001 where id=(select product_id from redemption_test_ids);
    raise exception 'TEST FAILED: excessive redemption accepted';
  exception when check_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select customer_id::text from redemption_test_ids),true);
select pg_temp.assert_redemption((select redemption_value_cents=123450 from public.products where id=(select product_id from redemption_test_ids)),'customer reads saved admin quote');
with changed as (update public.products set redemption_value_cents=1 where id=(select product_id from redemption_test_ids) returning id)
select pg_temp.assert_redemption((select count(*)=0 from changed),'customer cannot edit redemption values');
select set_config('request.jwt.claim.sub',(select admin_id::text from redemption_test_ids),true);
update public.products set active=false where id=(select product_id from redemption_test_ids);
select set_config('request.jwt.claim.sub',(select customer_id::text from redemption_test_ids),true);
select pg_temp.assert_redemption((select count(*)=0 from public.products where id=(select product_id from redemption_test_ids)),'hidden products are not exposed to customers');
reset role;
rollback;
select 'PASS: admin sets redemption values, purchase prices remain independent, customer sees saved values, customer edits denied, invalid values rejected, hidden products excluded. All test fixtures rolled back.' as result;
