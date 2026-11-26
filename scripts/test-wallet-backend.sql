-- Integration checks against the installed schema. All fixture data is rolled back.
begin;
create temporary table wallet_test_ids as select gen_random_uuid() as admin_id,gen_random_uuid() as customer_id,gen_random_uuid() as other_id,gen_random_uuid() as key_one,gen_random_uuid() as key_two,gen_random_uuid() as key_three;
grant select on wallet_test_ids to authenticated,anon;
create function pg_temp.assert_true(value boolean, message text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'TEST FAILED: %', message; end if; end; $$;
create function pg_temp.expect_error(query text, expected text) returns void language plpgsql as $$
declare failed boolean := false;
begin
  begin execute query; exception when others then
    if position(lower(expected) in lower(sqlerrm)) = 0 then raise exception 'Unexpected error: %',sqlerrm; end if;
    failed := true;
  end;
  if not failed then raise exception 'TEST FAILED: expected error containing %',expected; end if;
end; $$;
insert into auth.users(id,email) select admin_id,'wallet-test-admin@example.invalid' from wallet_test_ids union all select customer_id,'wallet-test-customer@example.invalid' from wallet_test_ids union all select other_id,'wallet-test-other@example.invalid' from wallet_test_ids;
insert into public.user_roles(user_id,role) select admin_id,'admin' from wallet_test_ids;
insert into public.user_verifications(user_id,status) select customer_id,'verified' from wallet_test_ids union all select other_id,'rejected'::public.verification_status from wallet_test_ids;
insert into public.products(sku,name,weight_label,oz_amount,price_cents,active) values('WALLET-TEST-DRAFT','Hidden test draft','1 oz',1,100,false);

select set_config('request.jwt.claim.sub',(select admin_id::text from wallet_test_ids),true);
set local role authenticated;
select pg_temp.assert_true(wallet_private.is_admin(),'admin role lookup');
update public.products set price_cents=12345 where sku='WALLET-TEST-DRAFT';
select pg_temp.assert_true((select price_cents=12345 from public.products where sku='WALLET-TEST-DRAFT'),'admin can update product prices');
select pg_temp.assert_true((public.admin_stats()->>'active_products')::integer >= 4,'dashboard stats');
select pg_temp.assert_true(exists(select 1 from public.admin_customers('wallet-test-customer',0)),'admin customer search');
select public.record_settled_credit(customer_id,10000,'WALLET-TEST-SETTLEMENT') from wallet_test_ids;
select pg_temp.expect_error(format('select public.record_settled_credit(%L,10000,%L)',customer_id,'WALLET-TEST-SETTLEMENT'),'duplicate key') from wallet_test_ids;
select pg_temp.assert_true((select available_cents=10000 from public.cash_accounts where user_id=(select customer_id from wallet_test_ids)),'credit duplicate did not increase cash');

select set_config('request.jwt.claim.sub',(select customer_id::text from wallet_test_ids),true);
select pg_temp.assert_true(not wallet_private.is_admin(),'customer is not admin');
with changed as (update public.products set price_cents=1 where sku='WALLET-TEST-DRAFT' returning id)
select pg_temp.assert_true((select count(*)=0 from changed),'customer cannot change product prices');
select pg_temp.expect_error('insert into public.products(sku,name,weight_label,oz_amount,price_cents) values(''CUSTOMER-FAKE'',''Fake'',''1 oz'',1,1)','row-level security');
select pg_temp.expect_error('insert into public.transactions(user_id,product_name,oz_amount,purchase_price_zar,status) values(auth.uid(),''Fake'',1,1,''completed'')','permission denied');
select pg_temp.expect_error('select public.admin_stats()','Administrator access required');
select pg_temp.expect_error('select * from public.admin_customers()','Administrator access required');
select pg_temp.expect_error('update public.cash_accounts set available_cents=999999','permission denied');
select pg_temp.expect_error('update public.withdrawal_requests set status=''paid''','permission denied');
select pg_temp.expect_error('insert into public.user_roles(user_id,role) values(auth.uid(),''admin'')','permission denied');
select pg_temp.expect_error(format('select public.record_settled_credit(%L,10000,%L)',customer_id,'WALLET-TEST-FAKE'),'Administrator access required') from wallet_test_ids;
select public.request_withdrawal(key_one,1000,'Test Customer','Test Bank','1234567890','250655','current') from wallet_test_ids;
select public.request_withdrawal(key_one,1000,'Test Customer','Test Bank','1234567890','250655','current') from wallet_test_ids;
select pg_temp.assert_true((select count(*)=1 from public.withdrawal_requests where user_id=(select customer_id from wallet_test_ids)),'duplicate request is idempotent');
select pg_temp.assert_true((select available_cents=9000 and reserved_cents=1000 from public.cash_accounts where user_id=(select customer_id from wallet_test_ids)),'funds reserved exactly once');
select pg_temp.expect_error(format('select public.request_withdrawal(%L,10000,%L,%L,%L,%L,%L)',key_two,'Test Customer','Test Bank','1234567890','250655','current'),'Insufficient settled cash balance') from wallet_test_ids;
select pg_temp.expect_error(format('select public.request_withdrawal(%L,-1,%L,%L,%L,%L,%L)',key_two,'Test Customer','Test Bank','1234567890','250655','current'),'valid withdrawal amount') from wallet_test_ids;
select public.request_withdrawal(key_two,2000,'Test Customer','Test Bank','1234567890','250655','current') from wallet_test_ids;

select set_config('request.jwt.claim.sub',(select other_id::text from wallet_test_ids),true);
select pg_temp.assert_true((select count(*)=0 from public.withdrawal_requests),'other customer cannot read requests');
select pg_temp.assert_true((select count(*)=0 from public.cash_accounts),'other customer cannot read balances');
select pg_temp.assert_true((select count(*)=0 from public.cash_ledger),'other customer cannot read ledger');
select pg_temp.assert_true((select count(*)=0 from public.wallet_notifications),'other customer cannot read admin alerts');
select pg_temp.expect_error('update public.user_verifications set status=''verified'' where user_id=auth.uid()','Only administrators');
select pg_temp.expect_error(format('select public.request_withdrawal(%L,100,%L,%L,%L,%L,%L)',key_three,'Other Customer','Test Bank','1234567890','250655','current'),'Identity verification required') from wallet_test_ids;

select set_config('request.jwt.claim.sub',(select admin_id::text from wallet_test_ids),true);
select pg_temp.assert_true((select count(*)=2 from public.wallet_notifications where withdrawal_id in(select id from public.withdrawal_requests where user_id=(select customer_id from wallet_test_ids))),'admin received withdrawal alerts');
select pg_temp.expect_error(format('select public.review_withdrawal(%L,%L,%L,null,false)',w.id,'approved',''),'confirmation required') from public.withdrawal_requests w,wallet_test_ids t where w.request_key=t.key_one;
select public.review_withdrawal(w.id,'approved','Bank details checked',null,true) from public.withdrawal_requests w,wallet_test_ids t where w.request_key=t.key_one;
select pg_temp.expect_error(format('select public.review_withdrawal(%L,%L,%L,%L,true)',w.id,'paid','','TEST-PAYMENT'),'Invalid status transition') from public.withdrawal_requests w,wallet_test_ids t where w.request_key=t.key_one;
select public.review_withdrawal(w.id,'processing','Transfer submitted',null,false) from public.withdrawal_requests w,wallet_test_ids t where w.request_key=t.key_one;
select pg_temp.expect_error(format('select public.review_withdrawal(%L,%L,%L,null,true)',w.id,'paid',''),'payment reference') from public.withdrawal_requests w,wallet_test_ids t where w.request_key=t.key_one;
select public.review_withdrawal(w.id,'paid','Bank confirmed','TEST-PAYMENT',true) from public.withdrawal_requests w,wallet_test_ids t where w.request_key=t.key_one;
select pg_temp.expect_error(format('select public.review_withdrawal(%L,%L,%L,%L,true)',w.id,'paid','','TEST-PAYMENT'),'Invalid status transition') from public.withdrawal_requests w,wallet_test_ids t where w.request_key=t.key_one;
select public.review_withdrawal(w.id,'rejected','Bank account verification failed',null,false) from public.withdrawal_requests w,wallet_test_ids t where w.request_key=t.key_two;
select pg_temp.assert_true((select available_cents=9000 and reserved_cents=0 from public.cash_accounts where user_id=(select customer_id from wallet_test_ids)),'paid debit and rejected release reconcile');

select set_config('request.jwt.claim.sub',(select customer_id::text from wallet_test_ids),true);
select public.request_withdrawal(key_three,2000,'Test Customer','Test Bank','1234567890','250655','current') from wallet_test_ids;
select pg_temp.assert_true((select count(*)=4 from public.wallet_notifications where audience='customer'),'customer status notifications');
insert into public.wallet_notification_reads(notification_id,user_id) select id,auth.uid() from public.wallet_notifications where audience='customer' limit 1;
select pg_temp.assert_true((select count(*)=1 from public.wallet_notification_reads),'customer can mark own alert read');

select set_config('request.jwt.claim.sub',(select admin_id::text from wallet_test_ids),true);
select public.review_withdrawal(w.id,'approved','Bank details checked',null,true) from public.withdrawal_requests w,wallet_test_ids t where w.request_key=t.key_three;
select public.review_withdrawal(w.id,'processing','Transfer submitted',null,false) from public.withdrawal_requests w,wallet_test_ids t where w.request_key=t.key_three;
select public.review_withdrawal(w.id,'failed','Bank confirmed transfer definitively failed',null,true) from public.withdrawal_requests w,wallet_test_ids t where w.request_key=t.key_three;
select pg_temp.assert_true((select available_cents=9000 and reserved_cents=0 from public.cash_accounts where user_id=(select customer_id from wallet_test_ids)),'failed payout releases reservation');
select pg_temp.assert_true((select sum(available_delta)=9000 and sum(reserved_delta)=0 from public.cash_ledger where user_id=(select customer_id from wallet_test_ids)),'ledger equals account balances');

set local role anon;
select pg_temp.assert_true((select count(*)=0 from public.products where sku='WALLET-TEST-DRAFT'),'anonymous users cannot read drafts');
select pg_temp.assert_true((select count(*)>=4 from public.products where active),'published catalog is readable');
select pg_temp.expect_error('select * from public.withdrawal_requests','permission denied');
select pg_temp.expect_error('select public.admin_stats()','permission denied');
reset role;
rollback;
select 'PASS: admin authorization, customer isolation, verification gate, credit deduplication, withdrawal idempotency, balance reservation, status transitions, payouts, rejected/failed release, ledger reconciliation, notification delivery, draft privacy. All test fixtures rolled back.' as result;
