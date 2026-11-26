select jsonb_build_object(
  'tables',(select jsonb_agg(jsonb_build_object('table',relname,'rls',relrowsecurity)) from pg_class c join pg_namespace n on c.relnamespace=n.oid where n.nspname='public' and relname in('products','cash_accounts','cash_ledger','withdrawal_requests','wallet_notifications','wallet_notification_reads')),
  'product_count',(select count(*) from public.products),
  'unrestricted_cash_writes',has_table_privilege('authenticated','public.cash_accounts','UPDATE'),
  'unrestricted_withdrawal_writes',has_table_privilege('authenticated','public.withdrawal_requests','UPDATE'),
  'public_privileged_function_execution',(select coalesce(jsonb_agg(p.proname),'[]') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='wallet_private' and p.prosecdef and has_function_privilege('anon',p.oid,'EXECUTE')),
  'product_bucket',(select jsonb_build_object('public',public,'file_size_limit',file_size_limit,'mime_types',allowed_mime_types) from storage.buckets where id='product-images')
);
