# App & Database Security with Supabase

## Session Overview

This live session uses **The Black Drop**, a small vanilla HTML/CSS/JS coffee-shop ordering app, to show what Supabase's security model looks like when the browser talks directly to Postgres with no backend server in between. Most of the session happens in the Supabase dashboard — the app is here to make the dashboard concepts concrete.

You will learn how to:
- Read where Supabase API keys actually travel in a real request
- See what happens when Row Level Security (RLS) is missing, disabled, or misconfigured
- Read and write Postgres RLS policies that match a real access model (customer / barista / admin)
- Use Supabase's built-in Security Advisor to catch common RLS mistakes

By the end of the session, you should be able to:
- Explain why a public API key is safe to ship to a browser, but only *if* RLS is doing its job
- Write a `create policy` statement for a specific role and operation
- Use the dashboard's SQL Editor "Run as" role switch and the Security Advisor to test and audit a policy
- Recognize the common RLS mistakes covered in [supabase-security-guide.md](supabase-security-guide.md)

## Prerequisites

- A Supabase account and a project (free tier is fine)
- A modern browser with devtools (Network + Console tabs)
- Basic familiarity with SQL and HTML/JS — no framework knowledge needed, the app is plain static files

## Setup

1. Create a Supabase project and open its **SQL Editor**.
2. Run the files in `supabase/` **in order** — the numbering is the apply order:
   - `001_schema.sql` — tables, helper functions, triggers, RLS policies, and a starter menu
   - `002_demo_users.sql` — promotes three accounts to `admin`, `barista`, and `customer` by email (sign each one up first through `login.html`, matching the emails in this file, then run it)
   - `003_policy_logging.sql` — swaps in a logging version of the `my_role()` helper so every policy check writes to the Postgres log; used later in the demo
3. Copy your project's URL and anon/publishable key into [js/app.js](js/app.js) (`SUPABASE_URL` / `SUPABASE_KEY`).
4. Serve the site with any static file server, e.g.:
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000/index.html`.

## App Pages

| Page | Access level | What it shows |
|---|---|---|
| `index.html` | Public | Menu, read-only, no sign-in required |
| `login.html` | Public | Sign in / sign up |
| `order.html` | Signed-in customer | Place an order, see your own order history |
| `bar.html` | Barista or admin | All open orders, move them through their status |
| `admin.html` | Admin | Manage the menu and everyone's role |

Each page's access check happens in `initPage()` in [js/app.js](js/app.js) — but that's a UI nicety, not the real security boundary. The real boundary is the RLS policies in `supabase/001_schema.sql`, which hold even if someone skips the UI entirely and calls the API directly.

## Session Files

- Concepts and terms guide: [supabase-security-guide.md](supabase-security-guide.md)
- App code: [js/app.js](js/app.js) (shared across every page) plus one inline `<script>` per page
- Database: [supabase/001_schema.sql](supabase/001_schema.sql), [supabase/002_demo_users.sql](supabase/002_demo_users.sql), [supabase/003_policy_logging.sql](supabase/003_policy_logging.sql)
