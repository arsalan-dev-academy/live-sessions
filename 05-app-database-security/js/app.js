// Shared across every page: Supabase config, auth/db helpers, and UI/nav helpers.

const SUPABASE_URL = "https://belmejctdudhotyrcllx.supabase.co";
const SUPABASE_KEY = "sb_publishable_8nTHSiAcPH4dab6zL90igw_vFuqFF4f";

const SESSION_KEY = "tbd.session";

class DbError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function setSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

function storeAuth(data) {
  setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + data.expires_in,
    user: { id: data.user.id, email: data.user.email }
  });
}

async function authRequest(path, body, token) {
  const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;

  const res = await fetch(SUPABASE_URL + "/auth/v1/" + path, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new DbError(data.msg || data.error_description || data.message || "Something went wrong.", res.status);
  }
  return data;
}

async function signIn(email, password) {
  const data = await authRequest("token?grant_type=password", { email, password });
  storeAuth(data);
  return data;
}

async function signUp(email, password, fullName) {
  const data = await authRequest("signup", { email, password, data: { full_name: fullName } });
  if (data.access_token) storeAuth(data);
  return data;
}

async function signOut() {
  const session = getSession();
  setSession(null);
  if (session) {
    try {
      await authRequest("logout", {}, session.access_token);
    } catch {}
  }
}

async function currentToken() {
  const session = getSession();
  if (!session) return null;
  if (session.expires_at - 60 > Date.now() / 1000) return session.access_token;

  try {
    const data = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
    storeAuth(data);
    return data.access_token;
  } catch {
    setSession(null);
    return null;
  }
}

function friendlyError(status, body) {
  const code = body && body.code;
  if (code === "23503") return "This item is linked to existing orders. Take it off the menu instead.";
  if (code === "23514" || code === "22P02") return "Please check the values and try again.";
  if (status === 401 || status === 403 || code === "42501") return "You don't have permission to do that.";
  return "Something went wrong. Please try again.";
}

async function db(path, options = {}) {
  const token = await currentToken();
  const headers = { apikey: SUPABASE_KEY };
  if (token) headers.Authorization = "Bearer " + token;
  if (options.body) headers["Content-Type"] = "application/json";
  if (options.prefer) headers.Prefer = options.prefer;

  const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) throw new DbError(friendlyError(res.status, data), res.status, data && data.code);
  return data;
}

async function dbWrite(path, options) {
  const rows = await db(path, { ...options, prefer: "return=representation" });
  if (!rows || rows.length === 0) throw new DbError("You don't have permission to do that.", 403, "42501");
  return rows;
}

const ROLE_LEVEL = { customer: 1, barista: 2, admin: 3 };
const ACCESS_LEVEL = { public: 0, member: 1, staff: 2, admin: 3 };
const ROLE_NAMES = { customer: "Customer", barista: "Barista", admin: "Admin" };
const STATUS_NAMES = { placed: "Placed", brewing: "Brewing", ready: "Ready", collected: "Collected", cancelled: "Cancelled" };
const CATEGORIES = ["Espresso", "Filter & Cold", "Bakery"];

const currency = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

function formatPrice(value) {
  return currency.format(Number(value));
}

function formatWhen(iso) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === new Date().toDateString()) return time;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " + time;
}

function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, "");
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : String(child));
  }
  return node;
}

function showFlash(text, kind) {
  const flash = document.getElementById("flash");
  if (!flash) return;
  flash.textContent = text;
  flash.className = "flash" + (kind === "error" ? " error" : "");
  flash.hidden = false;
  clearTimeout(showFlash.timer);
  showFlash.timer = setTimeout(() => { flash.hidden = true; }, 6000);
}

function currentPage() {
  const name = location.pathname.split("/").pop();
  return name || "index.html";
}

function homeFor(role) {
  if (role === "admin") return "admin.html";
  if (role === "barista") return "bar.html";
  return "order.html";
}

async function loadProfile() {
  const session = getSession();
  if (!session) return null;
  try {
    const rows = await db("profiles?select=id,email,full_name,role&id=eq." + session.user.id);
    return rows[0] || null;
  } catch {
    return null;
  }
}

function renderNav(profile) {
  const nav = document.getElementById("nav");
  if (!nav) return;

  const level = profile ? ROLE_LEVEL[profile.role] || 0 : 0;
  const page = currentPage();
  const links = [["index.html", "Menu"]];
  if (level >= 1) links.push(["order.html", "Order"]);
  if (level >= 2) links.push(["bar.html", "Bar"]);
  if (level >= 3) links.push(["admin.html", "Admin"]);

  const list = el("ul", {},
    links.map(([href, label]) =>
      el("li", {}, el("a", { href, "aria-current": href === page ? "page" : null }, label))
    )
  );

  const account = profile
    ? el("div", { class: "account" },
        el("span", { class: "who" }, profile.full_name || profile.email, el("em", {}, ROLE_NAMES[profile.role] || "")),
        el("button", {
          class: "link-button",
          type: "button",
          onclick: async () => {
            await signOut();
            location.href = "index.html";
          }
        }, "Sign out")
      )
    : el("div", { class: "account" },
        el("a", { href: "login.html", "aria-current": page === "login.html" ? "page" : null }, "Sign in")
      );

  nav.replaceChildren(list, account);
}

function deniedView() {
  return el("section", { class: "notice" },
    el("p", { class: "eyebrow" }, "Staff area"),
    el("h1", {}, "This page isn't available to you."),
    el("p", {}, "It's reserved for the team behind the counter."),
    el("a", { class: "btn ghost", href: "index.html" }, "Back to the menu")
  );
}

async function initPage(access) {
  const profile = await loadProfile();
  renderNav(profile);

  const main = document.getElementById("main");
  const needed = ACCESS_LEVEL[access] || 0;
  const level = profile ? ROLE_LEVEL[profile.role] || 0 : 0;

  if (needed > 0 && !profile) {
    location.replace("login.html?next=" + encodeURIComponent(currentPage()));
    return null;
  }

  if (level < needed) {
    main.replaceChildren(deniedView());
    main.hidden = false;
    return null;
  }

  main.hidden = false;
  return { profile };
}
