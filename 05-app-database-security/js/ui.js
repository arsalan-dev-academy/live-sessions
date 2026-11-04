const ROLE_LEVEL = { customer: 1, barista: 2, admin: 3 };
const ACCESS_LEVEL = { public: 0, member: 1, staff: 2, admin: 3 };
const ROLE_NAMES = { customer: "Customer", barista: "Barista", admin: "Admin" };

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
