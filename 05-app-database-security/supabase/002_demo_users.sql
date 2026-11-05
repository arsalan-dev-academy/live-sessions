update public.profiles set role = 'admin',    full_name = 'Sam Okafor'  where email = 'admin@theblackdrop.test';
update public.profiles set role = 'barista',  full_name = 'Jonas Weber' where email = 'barista@theblackdrop.test';
update public.profiles set role = 'customer', full_name = 'Mara Lind'   where email = 'mara@theblackdrop.test';

select email, full_name, role from public.profiles order by role, email;