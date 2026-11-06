# Supabase Security Guide

A quick reference for the terms and concepts behind this session, using The Black Drop app as the running example.

## API Keys

- **anon / publishable key** — meant to be public. It identifies *which project* a request belongs to, not *who* the user is. This app's key sits in plain sight in `js/app.js` (`SUPABASE_KEY`) and goes out as the `apikey` header on every request.
- **service_role / secret key** — bypasses RLS entirely. It must never reach a browser. This app never uses it.

Open devtools → Network → filter to Fetch/XHR → any request to `*.supabase.co` → Headers, and you'll see `apikey` and, once signed in, `Authorization: Bearer <token>`.

## Where the Vulnerability Actually Lives

This app's `db()` function in [js/app.js](js/app.js) is a `fetch()` straight to `/rest/v1/<table>` — there's no backend server anywhere in this repo. The browser talks to Postgres directly.

Since the anon key is public by design, anyone with devtools open can replay the same requests the app makes, with the same key, without touching the UI at all. If a table has no row-level policy protecting it, that's enough to read or write every row in it. The key being visible isn't the problem — it's expected. The problem is a table left unprotected behind it.

## Row Level Security (RLS)

Once enabled on a table, every query against it is filtered through the policies you define, no matter who's asking or what client sent the request. No matching policy for an action means no rows, full stop:

```sql
alter table public.orders enable row level security;
```

Enabling RLS and granting privileges are two separate layers — this schema revokes everything first, then grants back only what's needed:

```sql
revoke all on public.profiles, public.menu_items, public.orders from anon, authenticated;
grant select, insert on public.orders to authenticated;
grant update (status) on public.orders to authenticated;
```

One real policy, piece by piece:

```sql
create policy "Orders: customers place own"
  on public.orders for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'placed'
    and exists (select 1 from public.menu_items m where m.id = item_id and m.is_available)
  );
```

`for insert` + `to authenticated` scope who this applies to; `with check (...)` is the condition a *new* row must satisfy — it must belong to the inserting user, start as `placed`, and reference an item that's actually available.

## RLS Best Practices

- **One policy per operation** (select/insert/update/delete) instead of a catch-all `for all`.
- **Centralize role lookups** in a helper function instead of repeating a subquery in every policy — see `my_role()` in `001_schema.sql`, which uses `security definer` (so it can read `profiles` regardless of the caller's own grants) and `set search_path = ''` (so it can't be hijacked by a malicious search path).
- **RLS can't express everything.** Comparing an old vs. new row — like blocking a user from promoting their own role — needs a trigger (`protect_role()` in `001_schema.sql`), not a policy.
- **Default to deny.** `revoke all` before granting anything back means a forgotten policy fails closed, not open.

## Storage Buckets

This app doesn't use Supabase Storage, but it's worth saying anyway: **Storage has its own, separate policy system.** RLS on your tables does nothing for files sitting in a bucket.

## Common Mistakes

- Creating a table and forgetting `enable row level security` — once any privilege is granted to `anon`/`authenticated`, an unprotected table is wide open.
- A policy that's just `using (true)` — compiles, "works," protects nothing.
- Trusting a client-supplied value (e.g. a `user_id` in the request body) instead of `auth.uid()`.
- Shipping the `service_role` key to a browser — it bypasses every policy you just wrote.
- Forgetting that RLS and a trigger can both be guarding the same table — removing one without checking the other can silently reopen a hole.

## Pre-Launch Checklist

- [ ] RLS enabled on every table
- [ ] Privileges start from `revoke all`, then grant back only what's needed
- [ ] A policy exists for every operation a role should be able to perform — and *only* those
- [ ] No policy uses `using (true)` / `with check (true)` without a deliberate reason
- [ ] No client-supplied identity field is trusted without a matching check
- [ ] The `service_role` key exists only in trusted server-side contexts, never in client code

## Security Advisor

Dashboard → **Advisors → Security Advisor** automatically flags tables with RLS disabled, missing policies, and other common misconfigurations — worth running on every real project, not just this demo one.

## If You Remember Nothing Else...

The anon key is meant to be public. RLS is the only thing standing between that public key and your entire database.
