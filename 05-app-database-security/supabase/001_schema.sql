-- Tables

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'barista', 'admin')),
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  category text not null check (category in ('Espresso', 'Filter & Cold', 'Bakery')),
  price numeric(5, 2) not null check (price >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  item_id bigint not null references public.menu_items (id),
  quantity int not null default 1 check (quantity between 1 and 10),
  status text not null default 'placed' check (status in ('placed', 'brewing', 'ready', 'collected', 'cancelled')),
  created_at timestamptz not null default now()
);


-- The role lookup every policy uses

create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;


-- A profile row for every new sign-up (always as 'customer')

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Nobody promotes themselves

create or replace function public.protect_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and current_user in ('anon', 'authenticated') then
    if coalesce(public.my_role(), '') <> 'admin' then
      raise exception 'Only an admin can change roles' using errcode = '42501';
    end if;
    if new.id = auth.uid() then
      raise exception 'Admins cannot change their own role' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_role
  before update on public.profiles
  for each row execute function public.protect_role();


-- Row Level Security

alter table public.profiles enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;


-- Table privileges (least privilege)

revoke all on public.profiles, public.menu_items, public.orders from anon, authenticated;

grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, role) on public.profiles to authenticated;

grant select, insert on public.orders to authenticated;
grant update (status) on public.orders to authenticated;

grant usage on all sequences in schema public to authenticated;


-- Policies: profiles

create policy "Profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Profiles: staff read all"
  on public.profiles for select to authenticated
  using ((select public.my_role()) in ('barista', 'admin'));

create policy "Profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Profiles: admin update any"
  on public.profiles for update to authenticated
  using ((select public.my_role()) = 'admin')
  with check ((select public.my_role()) = 'admin');


-- Policies: menu_items

create policy "Menu: everyone reads available items"
  on public.menu_items for select to anon, authenticated
  using (is_available);

create policy "Menu: staff read all items"
  on public.menu_items for select to authenticated
  using ((select public.my_role()) in ('barista', 'admin'));

create policy "Menu: admin adds items"
  on public.menu_items for insert to authenticated
  with check ((select public.my_role()) = 'admin');

create policy "Menu: admin edits items"
  on public.menu_items for update to authenticated
  using ((select public.my_role()) = 'admin')
  with check ((select public.my_role()) = 'admin');

create policy "Menu: admin removes items"
  on public.menu_items for delete to authenticated
  using ((select public.my_role()) = 'admin');


-- Policies: orders

create policy "Orders: customers read own"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Orders: staff read all"
  on public.orders for select to authenticated
  using ((select public.my_role()) in ('barista', 'admin'));

create policy "Orders: customers place own"
  on public.orders for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'placed'
    and exists (select 1 from public.menu_items m where m.id = item_id and m.is_available)
  );

create policy "Orders: staff update status"
  on public.orders for update to authenticated
  using ((select public.my_role()) in ('barista', 'admin'))
  with check ((select public.my_role()) in ('barista', 'admin'));


-- Menu

insert into public.menu_items (name, description, category, price, is_available) values
  ('Espresso',         'Double shot, house blend',            'Espresso',      2.40, true),
  ('Cortado',          'Espresso cut with warm milk',         'Espresso',      3.20, true),
  ('Flat White',       'Double ristretto, silky milk',        'Espresso',      3.60, true),
  ('Gesha Reserve',    'Limited lot, ask at the bar',         'Espresso',      7.50, false),
  ('V60',              'Hand-poured, rotating single origin', 'Filter & Cold', 3.80, true),
  ('Batch Brew',       'Today''s filter, ready to go',        'Filter & Cold', 2.80, true),
  ('Cold Brew',        'Steeped for 16 hours',                'Filter & Cold', 4.20, true),
  ('Cardamom Bun',     'Baked every morning',                 'Bakery',        3.50, true),
  ('Almond Croissant', 'Twice baked, frangipane',             'Bakery',        3.90, true),
  ('Banana Bread',     'With brown butter',                   'Bakery',        3.20, true);
