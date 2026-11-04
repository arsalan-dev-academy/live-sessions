const CATEGORY_OPTIONS = ["Espresso", "Filter & Cold", "Bakery"];

initPage("admin").then(async (ctx) => {
  if (!ctx) return;
  const me = ctx.profile;

  async function loadFigures() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const orders = await db(
      "orders?select=quantity,status,menu_items(price)&created_at=gte." + encodeURIComponent(start.toISOString())
    );
    const counted = orders.filter((o) => o.status !== "cancelled");
    const revenue = counted.reduce((sum, o) => sum + (o.menu_items ? o.menu_items.price * o.quantity : 0), 0);
    const open = orders.filter((o) => ["placed", "brewing", "ready"].includes(o.status)).length;

    document.getElementById("fig-orders").textContent = counted.length;
    document.getElementById("fig-revenue").textContent = formatPrice(revenue);
    document.getElementById("fig-open").textContent = open;
  }

  function menuRow(item) {
    const price = el("input", {
      type: "number", step: "0.01", min: "0", class: "input-price",
      value: Number(item.price).toFixed(2), "aria-label": "Price for " + item.name
    });
    const available = el("input", { type: "checkbox", checked: item.is_available });
    const save = el("button", { class: "btn small", type: "button" }, "Save");
    const remove = el("button", { class: "btn small ghost", type: "button" }, "Remove");

    save.addEventListener("click", async () => {
      save.disabled = true;
      try {
        await dbWrite("menu_items?id=eq." + item.id, {
          method: "PATCH",
          body: { price: Number(price.value), is_available: available.checked }
        });
        showFlash(item.name + " updated.");
      } catch (error) {
        showFlash(error.message, "error");
      } finally {
        save.disabled = false;
      }
    });

    remove.addEventListener("click", async () => {
      if (!confirm("Remove " + item.name + " from the menu?")) return;
      remove.disabled = true;
      try {
        await dbWrite("menu_items?id=eq." + item.id, { method: "DELETE" });
        showFlash(item.name + " removed.");
        await loadMenu();
      } catch (error) {
        showFlash(error.message, "error");
        remove.disabled = false;
      }
    });

    return el("tr", {},
      el("td", {}, el("strong", {}, item.name), item.description ? el("div", { class: "muted small" }, item.description) : null),
      el("td", {}, item.category),
      el("td", {}, price),
      el("td", {}, el("label", { class: "check" }, available, " On menu")),
      el("td", { class: "actions" }, save, remove)
    );
  }

  async function loadMenu() {
    const items = await db("menu_items?select=id,name,description,category,price,is_available&order=category.asc,name.asc");
    document.getElementById("menu-rows").replaceChildren(...items.map(menuRow));
  }

  function personRow(person) {
    const isMe = person.id === me.id;
    const role = el("select", { "aria-label": "Role for " + (person.full_name || person.email), disabled: isMe },
      Object.keys(ROLE_NAMES).map((key) => el("option", { value: key, selected: key === person.role }, ROLE_NAMES[key]))
    );
    const save = el("button", { class: "btn small", type: "button", disabled: isMe }, "Save");

    save.addEventListener("click", async () => {
      save.disabled = true;
      try {
        await dbWrite("profiles?id=eq." + person.id, { method: "PATCH", body: { role: role.value } });
        showFlash((person.full_name || person.email) + " is now " + ROLE_NAMES[role.value].toLowerCase() + ".");
      } catch (error) {
        showFlash(error.message, "error");
      } finally {
        save.disabled = false;
      }
    });

    return el("tr", {},
      el("td", {}, person.full_name || "—", isMe ? el("span", { class: "tag" }, "You") : null),
      el("td", {}, person.email),
      el("td", {}, role),
      el("td", { class: "actions" }, save)
    );
  }

  async function loadPeople() {
    const people = await db("profiles?select=id,email,full_name,role&order=role.asc,email.asc");
    document.getElementById("people-rows").replaceChildren(...people.map(personRow));
  }

  const addForm = document.getElementById("add-form");
  addForm.querySelector("select[name=category]").replaceChildren(
    ...CATEGORY_OPTIONS.map((c) => el("option", { value: c }, c))
  );

  addForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(addForm);
    const button = addForm.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      await dbWrite("menu_items", {
        method: "POST",
        body: {
          name: data.get("name").trim(),
          description: data.get("description").trim() || null,
          category: data.get("category"),
          price: Number(data.get("price")),
          is_available: true
        }
      });
      showFlash(data.get("name").trim() + " added to the menu.");
      addForm.reset();
      await loadMenu();
    } catch (error) {
      showFlash(error.message, "error");
    } finally {
      button.disabled = false;
    }
  });

  try {
    await Promise.all([loadFigures(), loadMenu(), loadPeople()]);
  } catch (error) {
    showFlash(error.message, "error");
  }
});
