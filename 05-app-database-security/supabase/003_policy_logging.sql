create or replace function public.my_role()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result text;
  who text;
  target text;
begin
  select role into result from public.profiles where id = auth.uid();

  who := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', 'unknown user');
  target := coalesce((regexp_match(current_query(), '(?:FROM|INTO|UPDATE) "public"\."([a-z_]+)"'))[1], 'a table');

  raise log 'policy check on %: % has role %', target, who, coalesce(result, 'none');

  return result;
end;
$$;
