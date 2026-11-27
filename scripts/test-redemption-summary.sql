begin;
create temporary table redemption_summary_test as select gen_random_uuid() as buyer,gen_random_uuid() as other_buyer,gen_random_uuid() as full_product,gen_random_uuid() as quarter_product,gen_random_uuid() as missing_product,gen_random_uuid() as full_tx,gen_random_uuid() as quarter_tx,gen_random_uuid() as missing_tx;
grant select on redemption_summary_test to authenticated;
insert into auth.users(id,email) select buyer,'redemption-summary@example.invalid' from redemption_summary_test union all select other_buyer,'redemption-other@example.invalid' from redemption_summary_test;
insert into public.products(id,sku,name,weight_label,oz_amount,price_cents,redemption_value_cents,active)
select full_product,'SUMMARY-FULL-'||full_product,'Summary full '||full_product,'1 oz',1,200000,100000,false from redemption_summary_test union all
select quarter_product,'SUMMARY-QUARTER-'||quarter_product,'Summary 1/4oz '||quarter_product,'1/4 oz',0.25,90000,25000,true from redemption_summary_test union all
select missing_product,'SUMMARY-MISSING-'||missing_product,'Summary unpriced '||missing_product,'1 oz',1,10000,null,true from redemption_summary_test;
insert into public.transactions(id,user_id,product_name,oz_amount,purchase_price_zar,status)
select full_tx,buyer,'Old product name',1,2000,'completed' from redemption_summary_test union all
select quarter_tx,buyer,'Summary ¼oz '||quarter_product,0.5,1800,'completed' from redemption_summary_test;
insert into public.payment_orders(user_id,product_id,request_key,product_name,oz_amount,amount_cents,payment_mode,status,transaction_id)
select buyer,full_product,gen_random_uuid(),'Old product name',1,200000,'live','paid',full_tx from redemption_summary_test;
create function pg_temp.check_summary(value boolean,message text) returns void language plpgsql as $$ begin if value is distinct from true then raise exception 'TEST FAILED: %',message; end if; end; $$;
select set_config('request.jwt.claim.sub',(select buyer::text from redemption_summary_test),true);
set local role authenticated;
select pg_temp.check_summary((public.redemption_summary()->>'redeemable_cents')::numeric=150000,'unit prices multiply by owned quantities, including fractional products');
select pg_temp.check_summary((public.redemption_summary()->>'total_oz')::numeric=1.5,'owned ounces');
select pg_temp.check_summary((public.redemption_summary()->>'missing_prices')::integer=0,'legacy Unicode fractions match the admin ASCII product name');
select pg_temp.check_summary((public.redemption_summary()->>'missing_prices')::integer=0,'hidden owned product and renamed order retain correct price linkage');
select set_config('request.jwt.claim.sub',(select other_buyer::text from redemption_summary_test),true);
select pg_temp.check_summary((public.redemption_summary()->>'redeemable_cents')::numeric=0,'empty account cannot see another customer valuation');
reset role;
update public.transactions set product_id=(select quarter_product from redemption_summary_test), product_unit_oz=0.25 where id=(select quarter_tx from redemption_summary_test);
update public.products set name='Renamed quarter coin '||id::text,oz_amount=0.5 where id=(select quarter_product from redemption_summary_test);
update public.products set redemption_value_cents=120000 where id=(select full_product from redemption_summary_test);
select set_config('request.jwt.claim.sub',(select buyer::text from redemption_summary_test),true);
set local role authenticated;
select pg_temp.check_summary((public.redemption_summary()->>'redeemable_cents')::numeric=170000,'admin price changes update valuation; stable legacy IDs and unit snapshots survive product renames and weight edits');
reset role;
insert into public.transactions(id,user_id,product_name,oz_amount,purchase_price_zar,status)
select missing_tx,buyer,'Summary unpriced '||missing_product,1,100,'completed' from redemption_summary_test;
set local role authenticated;
select pg_temp.check_summary(public.redemption_summary()->>'redeemable_cents' is null,'missing admin quote never falls back to spot or purchase price');
select pg_temp.check_summary((public.redemption_summary()->>'missing_prices')::integer=1,'missing price is reported explicitly');
reset role;
rollback;
select 'PASS: admin unit pricing, fractional quantities, purchase-price independence, renamed products, hidden owned products, customer isolation, live price updates, missing-price handling. Fixtures rolled back.' as result;
