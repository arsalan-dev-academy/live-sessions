const STATUS_NAMES = { placed: "Placed", brewing: "Brewing", ready: "Ready", collected: "Collected", cancelled: "Cancelled" };

initPage("member").then(async (ctx) => {
  if (!ctx) return;
  const me = ctx.profile;
  const select = document.getElementById("item-select");
  const form = document.getElementById("order-form");

  async function loadItems() {
    const items = await db("menu_items?select=id,name,category,price&is_available=eq.true&order=category.asc,price.asc");
    const groups = {};
    for (const item of items) (groups[item.category] ||= []).push(item);
    select.replaceChildren(
      ...Object.entries(groups).map(([category, list]) =>
        el("optgroup", { label: category },
          list.map((item) => el("option", { value: item.id }, item.name + " — " + formatPrice(item.price)))
        )
      )
    );
  }

  async function loadOrders() {
    const body = document.getElementById("orders");
    const empty = document.getElementById("orders-empty");
    const orders = await db(
      "orders?select=id,quantity,status,created_at,menu_items(name,price)" +
      "&user_id=eq." + me.id + "&order=created_at.desc&limit=20"
    );
    empty.hidden = orders.length > 0;
    body.replaceChildren(
      ...orders.map((order) => {
        const item = order.menu_items;
        return el("tr", {},
          el("td", { class: "num" }, "#" + order.id),
          el("td", {}, formatWhen(order.created_at)),
          el("td", {}, item ? item.name : "—"),
          el("td", { class: "num" }, order.quantity),
          el("td", { class: "num" }, item ? formatPrice(item.price * order.quantity) : "—"),
          el("td", {}, el("span", { class: "status " + order.status }, STATUS_NAMES[order.status]))
        );
      })
    );
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    const data = new FormData(form);
    try {
      await dbWrite("orders", {
        method: "POST",
        body: { item_id: Number(data.get("item_id")), quantity: Number(data.get("quantity")) }
      });
      form.reset();
      showFlash("Thanks, " + (me.full_name || "friend").split(" ")[0] + ". We'll call your name at the bar.");
      await loadOrders();
    } catch (error) {
      showFlash(error.message, "error");
    } finally {
      button.disabled = false;
    }
  });

  try {
    await Promise.all([loadItems(), loadOrders()]);
  } catch (error) {
    showFlash(error.message, "error");
  }
});
