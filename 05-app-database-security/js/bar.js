const STATUS_NAMES = { placed: "Placed", brewing: "Brewing", ready: "Ready", collected: "Collected", cancelled: "Cancelled" };
const NEXT_STEP = { placed: ["brewing", "Start"], brewing: ["ready", "Ready"], ready: ["collected", "Collected"] };

initPage("staff").then(async (ctx) => {
  if (!ctx) return;
  let view = "open";

  async function setStatus(order, status, button) {
    button.disabled = true;
    try {
      await dbWrite("orders?id=eq." + order.id, { method: "PATCH", body: { status } });
      await loadOrders();
    } catch (error) {
      showFlash(error.message, "error");
      button.disabled = false;
    }
  }

  function actionsFor(order) {
    const cell = el("td", { class: "actions" });
    const step = NEXT_STEP[order.status];
    if (step) {
      const button = el("button", { class: "btn small", type: "button" }, step[1]);
      button.addEventListener("click", () => setStatus(order, step[0], button));
      cell.append(button);
    }
    if (order.status === "placed") {
      const cancel = el("button", { class: "btn small ghost", type: "button" }, "Cancel");
      cancel.addEventListener("click", () => {
        if (confirm("Cancel order #" + order.id + "?")) setStatus(order, "cancelled", cancel);
      });
      cell.append(cancel);
    }
    return cell;
  }

  async function loadOrders() {
    const body = document.getElementById("orders");
    const empty = document.getElementById("orders-empty");
    let query = "orders?select=id,quantity,status,created_at,menu_items(name),profiles(full_name,email)&order=created_at.desc&limit=100";
    if (view === "open") query += "&status=in.(placed,brewing,ready)";

    try {
      const orders = await db(query);
      empty.hidden = orders.length > 0;
      body.replaceChildren(
        ...orders.map((order) =>
          el("tr", {},
            el("td", { class: "num" }, "#" + order.id),
            el("td", {}, formatWhen(order.created_at)),
            el("td", {}, order.profiles ? order.profiles.full_name || order.profiles.email : "—"),
            el("td", {}, order.menu_items ? order.menu_items.name : "—"),
            el("td", { class: "num" }, order.quantity),
            el("td", {}, el("span", { class: "status " + order.status }, STATUS_NAMES[order.status])),
            actionsFor(order)
          )
        )
      );
      document.getElementById("updated").textContent = "Updated " + formatWhen(new Date().toISOString());
    } catch (error) {
      showFlash(error.message, "error");
    }
  }

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      view = button.dataset.view;
      document.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      loadOrders();
    });
  });

  document.getElementById("refresh").addEventListener("click", loadOrders);
  setInterval(loadOrders, 20000);
  loadOrders();
});
