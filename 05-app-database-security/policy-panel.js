(function () {
  if (typeof SHOW_POLICY_PANEL === "undefined" || !SHOW_POLICY_PANEL) return;

  const isStaff = (r) => r === "barista" || r === "admin";
  const isAdmin = (r) => r === "admin";
  const signedIn = (r) => !!r;

  const POLICIES = {
    menuPublic: { table: "menu_items", action: "SELECT", name: "Everyone reads available items", sql: "using (is_available)", applies: () => true },
    menuStaff: { table: "menu_items", action: "SELECT", name: "Staff read all items", sql: "using (my_role() in ('barista', 'admin'))", applies: isStaff },
    menuInsert: { table: "menu_items", action: "INSERT", name: "Admin adds items", sql: "with check (my_role() = 'admin')", applies: isAdmin },
    menuUpdate: { table: "menu_items", action: "UPDATE", name: "Admin edits items", sql: "using (my_role() = 'admin')", applies: isAdmin },
    menuDelete: { table: "menu_items", action: "DELETE", name: "Admin removes items", sql: "using (my_role() = 'admin')", applies: isAdmin },
    ordersOwn: { table: "orders", action: "SELECT", name: "Customers read own orders", sql: "using (user_id = auth.uid())", applies: signedIn },
    ordersStaff: { table: "orders", action: "SELECT", name: "Staff read all orders", sql: "using (my_role() in ('barista', 'admin'))", applies: isStaff },
    ordersInsert: { table: "orders", action: "INSERT", name: "Customers place own orders", sql: "with check (user_id = auth.uid()\n  and status = 'placed'\n  and exists (select 1 from menu_items m\n              where m.id = item_id and m.is_available))", applies: signedIn },
    ordersUpdate: { table: "orders", action: "UPDATE", name: "Staff update order status", sql: "using (my_role() in ('barista', 'admin'))", applies: isStaff },
    profilesOwn: { table: "profiles", action: "SELECT", name: "Read own profile", sql: "using (id = auth.uid())", applies: signedIn },
    profilesStaff: { table: "profiles", action: "SELECT", name: "Staff read all profiles", sql: "using (my_role() in ('barista', 'admin'))", applies: isStaff },
    profilesAdmin: { table: "profiles", action: "UPDATE", name: "Admin updates any profile", sql: "using (my_role() = 'admin')", applies: isAdmin },
    protectRole: { table: "profiles", action: "TRIGGER", name: "protect_role: nobody promotes themselves", sql: "if new.role <> old.role and my_role() <> 'admin'\n  then raise exception 'Only an admin can change roles';", applies: () => true }
  };

  const PAGES = {
    "index.html": { gate: null, policies: ["menuPublic", "menuStaff"] },
    "login.html": { gate: null, policies: [], auth: true },
    "order.html": { gate: "signed-in users", policies: ["menuPublic", "ordersOwn", "ordersInsert"] },
    "bar.html": { gate: "baristas and admins", policies: ["ordersStaff", "ordersUpdate", "profilesStaff"] },
    "admin.html": { gate: "admins", policies: ["ordersStaff", "menuStaff", "menuInsert", "menuUpdate", "menuDelete", "profilesStaff", "profilesAdmin", "protectRole"] }
  };

  const ACTIONS = { GET: "SELECT", POST: "INSERT", PATCH: "UPDATE", DELETE: "DELETE" };
  const log = [];
  let me = null;
  let identityKnown = false;

  const originalDb = db;
  db = async function (path, options = {}) {
    const entry = {
      action: ACTIONS[options.method || "GET"] || options.method,
      table: path.split("?")[0],
      result: "…",
      kind: "pending"
    };
    log.unshift(entry);
    if (log.length > 8) log.pop();
    render();
    try {
      const rows = await originalDb(path, options);
      const count = Array.isArray(rows) ? rows.length : 0;
      if (entry.action === "SELECT") {
        entry.result = count + (count === 1 ? " row visible" : " rows visible");
        entry.kind = "ok";
      } else if (count === 0 && options.prefer === "return=representation") {
        entry.result = "0 rows matched a policy, nothing changed";
        entry.kind = "blocked";
      } else {
        entry.result = "allowed";
        entry.kind = "ok";
      }
      return rows;
    } catch (error) {
      const denied = error.status === 401 || error.status === 403 || error.code === "42501";
      entry.result = denied ? "rejected by policy" : "failed: " + error.message;
      entry.kind = "blocked";
      throw error;
    } finally {
      render();
    }
  };

  const originalLoadProfile = loadProfile;
  loadProfile = async function () {
    me = await originalLoadProfile();
    identityKnown = true;
    render();
    return me;
  };

  const style = document.createElement("style");
  style.textContent = `
    body { padding-bottom: 52px; }
    .pp { position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; background: #1a1612; color: #f3efe7;
          font: 14px/1.5 "Helvetica Neue", Helvetica, Arial, sans-serif; border-top: 3px solid #8a3a1b; }
    .pp-bar { display: flex; align-items: center; gap: 16px; width: 100%; max-width: 1000px; margin: 0 auto;
              padding: 13px 24px; background: none; border: 0; color: inherit; font: inherit; cursor: pointer; text-align: left; }
    .pp-bar strong { font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 600; }
    .pp-bar span { color: #b7aea3; font-size: 0.85rem; flex: 1; }
    .pp-bar i { font-style: normal; transition: transform .2s; }
    .pp.open .pp-bar i { transform: rotate(180deg); }
    .pp-body { display: none; max-height: 58vh; overflow-y: auto; border-top: 1px solid #3a332c; }
    .pp.open .pp-body { display: block; }
    .pp-inner { max-width: 1000px; margin: 0 auto; padding: 24px 24px 32px; display: grid; grid-template-columns: 1fr 1.25fr; gap: 40px; }
    .pp h3 { font: 400 1.15rem "Iowan Old Style", Palatino, Georgia, serif; margin: 0 0 12px; color: #f3efe7; }
    .pp h4 { margin: 24px 0 8px; font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: #c9774f; font-weight: 600; }
    .pp ol { margin: 0; padding-left: 20px; color: #d8d0c4; }
    .pp li { margin-bottom: 6px; }
    .pp code, .pp pre { font: 12.5px/1.5 ui-monospace, Menlo, Consolas, monospace; }
    .pp code { background: #2b2520; padding: 1px 5px; color: #f3efe7; }
    .pp-id { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; margin: 0; }
    .pp-id dt { color: #9c9389; }
    .pp-id dd { margin: 0; }
    .pp-gate { margin: 0; color: #d8d0c4; }
    .pp-policy { border: 1px solid #3a332c; padding: 10px 12px; margin-bottom: 8px; }
    .pp-policy.off { opacity: 0.45; }
    .pp-policy header { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
    .pp-policy b { font-weight: 500; }
    .pp-policy small { font-size: 0.66rem; letter-spacing: 0.1em; text-transform: uppercase; color: #9c9389; }
    .pp-policy em { margin-left: auto; font-style: normal; font-size: 0.66rem; letter-spacing: 0.1em; text-transform: uppercase; }
    .pp-policy:not(.off) em { color: #8fbf85; }
    .pp-policy pre { margin: 8px 0 0; white-space: pre-wrap; color: #e9c7a7; }
    .pp-log { list-style: none; padding: 0; margin: 0; }
    .pp-log li { display: flex; gap: 10px; padding: 6px 0; border-bottom: 1px solid #2f2924; font-size: 0.85rem; }
    .pp-log li span:first-child { min-width: 64px; color: #9c9389; font-family: ui-monospace, Menlo, monospace; font-size: 0.78rem; }
    .pp-log li span:nth-child(2) { min-width: 90px; }
    .pp-log .ok { color: #8fbf85; }
    .pp-log .blocked { color: #e58a74; }
    .pp-log .pending { color: #9c9389; }
    @media (max-width: 760px) { .pp-inner { grid-template-columns: 1fr; gap: 8px; } }
  `;
  document.head.append(style);

  const page = PAGES[currentPage()] || PAGES["index.html"];
  const panel = el("section", { class: "pp", "aria-label": "How access is checked" });
  const bar = el("button", { class: "pp-bar", type: "button", "aria-expanded": "false" });
  const body = el("div", { class: "pp-body" });
  panel.append(bar, body);

  let open = false;
  try { open = sessionStorage.getItem("tbd.pp") === "open"; } catch {}

  function setOpen(value) {
    open = value;
    panel.classList.toggle("open", open);
    bar.setAttribute("aria-expanded", String(open));
    try { sessionStorage.setItem("tbd.pp", open ? "open" : "closed"); } catch {}
  }

  bar.addEventListener("click", () => setOpen(!open));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) setOpen(false); });

  function identity() {
    const dbRole = me ? "authenticated" : "anon";
    return el("dl", { class: "pp-id" },
      el("dt", {}, "Postgres role"), el("dd", {}, el("code", {}, dbRole)),
      el("dt", {}, "auth.uid()"), el("dd", {}, el("code", {}, me ? me.id.slice(0, 8) + "…" : "null")),
      el("dt", {}, "my_role()"), el("dd", {}, el("code", {}, me ? "'" + me.role + "'" : "null"))
    );
  }

  function steps() {
    if (page.auth) {
      return el("ol", {},
        el("li", {}, "Email and password go to Supabase Auth, not to your tables."),
        el("li", {}, "Auth checks the password hash in ", el("code", {}, "auth.users"), " and returns a signed token (JWT) holding your user id."),
        el("li", {}, "Every later request carries that token, so Postgres knows who is asking."),
        el("li", {}, "New sign-ups get a ", el("code", {}, "profiles"), " row as ", el("code", {}, "'customer'"), " from a trigger. The form can't choose a role.")
      );
    }
    return el("ol", {},
      el("li", {}, "The browser sends the request with your token, or just the public key when signed out."),
      el("li", {}, "Supabase checks the token's signature and runs the query as ", el("code", {}, "anon"), " or ", el("code", {}, "authenticated"), "."),
      el("li", {}, "Postgres adds every matching policy to the query. Rows no policy allows are simply invisible."),
      el("li", {}, "Writes must also pass ", el("code", {}, "with check"), ", or they are rejected.")
    );
  }

  function policyList() {
    const role = me ? me.role : null;
    return page.policies.map((key) => {
      const p = POLICIES[key];
      const on = p.applies(role);
      return el("div", { class: "pp-policy" + (on ? "" : " off") },
        el("header", {},
          el("small", {}, p.action + " · " + p.table),
          el("b", {}, p.name),
          el("em", {}, on ? "Applies to you" : "Not for you")
        ),
        el("pre", {}, p.sql)
      );
    });
  }

  function activity() {
    if (log.length === 0) return el("p", { class: "pp-gate" }, "No database requests yet.");
    return el("ul", { class: "pp-log" },
      log.map((entry) => el("li", {},
        el("span", {}, entry.action),
        el("span", {}, entry.table),
        el("span", { class: entry.kind }, entry.result)
      ))
    );
  }

  function render() {
    const who = !identityKnown ? "Checking…" : me ? (me.full_name || me.email) + " · " + me.role : "Signed out · anon";
    bar.replaceChildren(
      el("strong", {}, "How access is checked"),
      el("span", {}, who),
      el("i", { "aria-hidden": "true" }, "▲")
    );

    const left = el("div", {},
      el("h3", {}, page.auth ? "How sign-in works" : "How Supabase checks this page"),
      steps(),
      el("h4", {}, "Who the database thinks you are"),
      identity(),
      el("h4", {}, "Page gate"),
      el("p", { class: "pp-gate" }, page.gate
        ? "This page hides itself unless you're one of the " + page.gate + ". That's only for convenience: the policies on the right are what actually protect the data."
        : "Anyone can open this page.")
    );

    const right = el("div", {},
      page.policies.length ? el("h3", {}, "Policies on this page") : null,
      policyList(),
      el("h4", {}, "Live checks"),
      activity()
    );

    body.replaceChildren(el("div", { class: "pp-inner" }, left, right));
  }

  render();
  setOpen(open);
  document.body.append(panel);
})();
