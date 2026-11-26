-- Tests use synthetic orders within one transaction; no payments are sent.
begin;
create temporary table payfast_test_ids as select gen_random_uuid() as buyer,gen_random_uuid() as other_buyer,gen_random_uuid() as product,gen_random_uuid() as key_live,gen_random_uuid() as key_sandbox,gen_random_uuid() as key_second;
grant select on payfast_test_ids to authenticated,service_role;
insert into auth.users(id,email) select buyer,'payfast-buyer@example.invalid' from payfast_test_ids union all select other_buyer,'payfast-other@example.invalid' from payfast_test_ids;
insert into public.user_verifications(user_id,status) select buyer,'verified' from payfast_test_ids;
insert into public.products(id,sku,name,weight_label,oz_amount,price_cents,active)
select product,'PAYFAST-TEST-'||product::text,'PayFast test gold','1 oz',1,10000,true from payfast_test_ids;
create function pg_temp.check_payfast(value boolean,message text) returns void language plpgsql as $$ begin if value is distinct from true then raise exception 'TEST FAILED: %',message; end if; end; $$;
create function pg_temp.expect_payfast_error(query text,expected text) returns void language plpgsql as $$
declare failed boolean:=false; begin
  begin execute query; exception when others then
    if position(lower(expected) in lower(sqlerrm))=0 then raise exception 'Unexpected error: %',sqlerrm; end if;
    failed:=true;
  end;
  if not failed then raise exception 'TEST FAILED: expected %',expected; end if;
end; $$;
select set_config('request.jwt.claim.sub',(select buyer::text from payfast_test_ids),true);
select set_config('request.jwt.claims','{"role":"authenticated"}',true);
set local role authenticated;
select public.create_payfast_order(product,key_live,10000,'live') from payfast_test_ids;
select public.create_payfast_order(product,key_live,10000,'live') from payfast_test_ids;
select pg_temp.check_payfast((select count(*)=1 from public.payment_orders where user_id=(select buyer from payfast_test_ids)),'checkout retries create one order');
select pg_temp.expect_payfast_error(format('select public.create_payfast_order(%L,%L,1,''live'')',product,key_second),'price has changed') from payfast_test_ids;
select pg_temp.expect_payfast_error('update public.payment_orders set status=''paid''','permission denied');
select pg_temp.expect_payfast_error('select public.settle_payfast_order(gen_random_uuid(),''90001'',10000,''live'')','permission denied');
select public.create_payfast_order(product,key_sandbox,10000,'sandbox') from payfast_test_ids;
select public.create_payfast_order(product,key_second,10000,'live') from payfast_test_ids;

reset role;
-- Change catalog data after checkout to ensure settlement uses the order snapshot.
update public.products set price_cents=20000,oz_amount=2 where id=(select product from payfast_test_ids);
select set_config('request.jwt.claim.sub',(select other_buyer::text from payfast_test_ids),true);
set local role authenticated;
select pg_temp.check_payfast((select count(*)=0 from public.payment_orders),'other customers cannot read payment orders');
select pg_temp.expect_payfast_error(format('select public.create_payfast_order(%L,gen_random_uuid(),20000,''live'')',product),'Identity verification required') from payfast_test_ids;

reset role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
set local role service_role;
select pg_temp.expect_payfast_error(format('select public.settle_payfast_order(%L,''90001'',1,''live'')',o.id),'does not match') from public.payment_orders o,payfast_test_ids t where o.request_key=t.key_live;
select pg_temp.expect_payfast_error(format('select public.settle_payfast_order(%L,''90001'',10000,''sandbox'')',o.id),'does not match') from public.payment_orders o,payfast_test_ids t where o.request_key=t.key_live;
select public.settle_payfast_order(o.id,'90001',10000,'live') from public.payment_orders o,payfast_test_ids t where o.request_key=t.key_live;
select public.settle_payfast_order(o.id,'90001',10000,'live') from public.payment_orders o,payfast_test_ids t where o.request_key=t.key_live;
select pg_temp.check_payfast((select count(*)=1 and sum(oz_amount)=1 and sum(purchase_price_zar)=100 from public.transactions where user_id=(select buyer from payfast_test_ids)),'live settlement credits original snapshot exactly once');
select public.settle_payfast_order(o.id,'90002',10000,'sandbox') from public.payment_orders o,payfast_test_ids t where o.request_key=t.key_sandbox;
select pg_temp.check_payfast((select count(*)=1 from public.transactions where user_id=(select buyer from payfast_test_ids)),'sandbox payment cannot credit real gold');
select pg_temp.expect_payfast_error(format('select public.settle_payfast_order(%L,''90001'',10000,''live'')',o.id),'duplicate key') from public.payment_orders o,payfast_test_ids t where o.request_key=t.key_second;
select pg_temp.check_payfast((select count(*)=1 from public.transactions where user_id=(select buyer from payfast_test_ids)),'duplicate provider reference rolls back gold credit');
select pg_temp.check_payfast((select count(*)=0 from public.cash_accounts where user_id=(select buyer from payfast_test_ids)),'buying gold does not create withdrawable cash');
reset role;
rollback;
select 'PASS: price and quantity snapshots, customer isolation, verification requirement, retry idempotency, server-only settlement, exact-once gold credit, duplicate payment protection, sandbox isolation, and no cash credit. Fixtures rolled back.' as result;
