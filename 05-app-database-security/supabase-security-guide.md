# Supabase Security Guide

Terms and concepts for this session, using The Black Drop app as the running example. Not a full Postgres or Supabase course — just enough to follow the demo and read the dashboard with confidence.

## What is Supabase?

Supabase is a hosted Postgres database with a few extra layers wrapped around it:

- **Auth** — handles sign-up/sign-in, issues JWTs
- **PostgREST** — auto-generates a REST API over your tables (`/rest/v1/...`)
- **Storage** — file buckets, with their own separate policy system
- **Dashboard** — SQL Editor, Table Editor, Policies UI, Advisors

This app talks to Auth and PostgREST directly from the browser — see `authRequest()` and `db()` in [js/app.js](js/app.js). There is no backend server anywhere in this repo.

## API Keys

Two keys matter, and they are not interchangeable:

- **anon / publishable key** — meant to be public. It identifies *which project* a request belongs to, not *who* the user is. This app's key sits in plain sight in `js/app.js` (`SUPABASE_KEY`) and goes out as the `apikey` header on every request.
- **service_role / secret key** — bypasses RLS entirely. It must never reach a browser. This app never uses it.

To see it live: open devtools → Network → filter to Fetch/XHR → any request to `*.supabase.co` → Headers. You'll see `apikey`, and once signed in, `Authorization: Bearer <token>`.

## Supabase vs. Traditional Access

**Traditional:** browser → your backend → database. Your backend is the only thing allowed to touch the database, so access control lives in backend code you trust.

**Supabase, as used here:** browser → Postgres, directly, over HTTP. The `db()` function in [js/app.js](js/app.js) makes this literal — it's a `fetch()` straight to `/rest/v1/<table>`. There's no backend to put access rules in, so access control has to live **inside the database itself**.

## Where Does the Vulnerability Lie?

The anon key is public by design, and the browser talks straight to Postgres — so anyone with devtools open can replay the same requests the app makes, with the same key, without touching the app's UI at all. If a table has no row-level policy protecting it, that's enough to read or write every row in it.

The vulnerability isn't the key being visible — it's *expected* to be visible. The vulnerability is a table left unprotected behind it.

## RLS (Row Level Security)

Row Level Security is a Postgres feature: once enabled on a table, every query against it — no matter who's asking or what client sent it — is filtered through the policies you define. No matching policy for an action means no rows, full stop. `001_schema.sql` turns it on for all three tables:

```sql
alter table public.profiles enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
```

## Specifically in Supabase

PostgREST executes every request as the Postgres role mapped from the caller's JWT — `anon` for signed-out requests, `authenticated` for signed-in ones. Policies key off `auth.uid()` (the current user's id) and whatever role logic you write on top — that's what `my_role()` does here. The dashboard's **Authentication → Policies** tab is just a UI over the same policies defined in `001_schema.sql`.

## Technical Look at RLS-activating

Enabling RLS and granting table privileges are two separate layers, and this schema uses both:

```sql
alter table public.orders enable row level security;
...
revoke all on public.profiles, public.menu_items, public.orders from anon, authenticated;
grant select, insert on public.orders to authenticated;
grant update (status) on public.orders to authenticated;
```

`revoke all` runs first, then only the needed privileges are granted back. RLS narrows *which rows* a query can see; grants control *which operations and columns* are even reachable on the table at all.

## What a Rule Looks Like in Postgres

One real policy from `001_schema.sql`, piece by piece:

```sql
create policy "Orders: customers place own"
  on public.orders for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'placed'
    and exists (select 1 from public.menu_items m where m.id = item_id and m.is_available)
  );
```

- `for insert` — only applies to inserts
- `to authenticated` — only signed-in users
- `with check (...)` — the condition a *new* row must satisfy to be let in: it must belong to the inserting user, start as `placed`, and reference an item that's actually available

## Establishing Rules with AI *(optional)*

You can hand an LLM a schema and ask it to draft `create policy` statements — but always read the generated SQL yourself before running it. An AI that doesn't know your access model will happily write a policy that technically works and protects nothing.

## Example Rules for Prompt Instructions *(optional)*

If you do this, describe the access model explicitly — who can do what, keyed by role or `auth.uid()` — rather than pasting the schema and asking for "security policies." Vague prompts tend to produce `using (true)`.

## RLS Best Practices

- **One policy per operation** (select/insert/update/delete) instead of a single catch-all `for all` — easier to reason about and audit later.
- **Centralize role lookups** in a helper function instead of repeating a subquery in every policy:
  ```sql
  create or replace function public.my_role()
  returns text language sql stable security definer set search_path = ''
  as $$ select role from public.profiles where id = auth.uid() $$;
  ```
  `security definer` lets the function read `profiles` regardless of the caller's own grants; `set search_path = ''` pins the schema path so it can't be hijacked by a malicious search_path.
- **RLS can't express everything** — some rules need a trigger. `protect_role()` in `001_schema.sql` blocks a user from promoting their own role, something no single `using`/`with check` clause can enforce cleanly, since it has to compare the old and new row.
- **Default to deny.** `revoke all` before granting anything back means a forgotten policy fails closed, not open.

## Storage Buckets

This app doesn't use Supabase Storage, so there's no bucket here — but it's worth saying out loud: **Storage has its own, separate policy system.** RLS on your tables does nothing for files sitting in a bucket. If this app grew a "menu item photo" feature, that bucket would need its own policies written from scratch.

## Common Mistakes

- Creating a table and forgetting `enable row level security` — once any privilege is granted to `anon`/`authenticated`, an unprotected table is wide open.
- A policy that's just `using (true)` — compiles, "works," protects nothing.
- Trusting a client-supplied value (e.g. a `user_id` in the request body) instead of `auth.uid()`. The `"Orders: customers place own"` policy checks `user_id = auth.uid()` for exactly this reason — the client can send whatever it wants, the policy can't be fooled by it.
- Shipping the `service_role` key to a browser — it bypasses every policy you just wrote.
- Forgetting that RLS and a trigger can both be guarding the same table (see `protect_role()` above) — removing one without checking the other can silently reopen a hole.

## Testing Your Security *(optional)*

The dashboard SQL Editor has a **"Run as"** role switcher — the fastest way to prove a policy actually blocks what you think it blocks, without needing a second browser tab signed in as a different user.

## Pre-Launch Checklist

- [ ] RLS enabled on every table (`alter table ... enable row level security`)
- [ ] Privileges start from `revoke all`, then grant back only what's needed
- [ ] A policy exists for every operation a role should be able to perform — and *only* those
- [ ] No policy uses `using (true)` / `with check (true)` without a very deliberate reason
- [ ] No client-supplied identity field (`user_id`, `role`, etc.) is trusted without a matching check
- [ ] The `service_role` key exists only in trusted server-side contexts, never in client code
- [ ] Anything RLS can't express (like `protect_role()`) is covered by a trigger, and that trigger is itself tested

## Security Advisor (Supabase-specific)

Dashboard → **Advisors → Security Advisor** automatically flags tables with RLS disabled, missing policies, and a handful of other common misconfigurations — worth running on every real project, not just this demo one.

## If You Remember Nothing Else...

The anon key is meant to be public. RLS is the only thing standing between that public key and your entire database. If you only check one thing before shipping, check that every table has RLS enabled and a policy for every operation you actually want to allow.
