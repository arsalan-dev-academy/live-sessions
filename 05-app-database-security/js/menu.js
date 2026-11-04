const CATEGORIES = ["Espresso", "Filter & Cold", "Bakery"];

initPage("public").then(async (ctx) => {
  if (!ctx) return;
  const holder = document.getElementById("menu");

  try {
    const items = await db("menu_items?select=id,name,description,category,price,is_available&order=price.asc");

    const sections = CATEGORIES.map((category) => {
      const inCategory = items.filter((item) => item.category === category);
      if (inCategory.length === 0) return null;
      return el("section", { class: "menu-group" },
        el("h2", {}, category),
        el("ul", { class: "menu-list" },
          inCategory.map((item) =>
            el("li", { class: item.is_available ? "item" : "item off" },
              el("div", { class: "item-head" },
                el("span", { class: "item-name" }, item.name),
                item.is_available ? null : el("span", { class: "tag" }, "Off the menu"),
                el("span", { class: "leader", "aria-hidden": "true" }),
                el("span", { class: "item-price" }, formatPrice(item.price))
              ),
              item.description ? el("p", { class: "item-desc" }, item.description) : null
            )
          )
        )
      );
    });

    holder.replaceChildren(...sections.filter(Boolean));
  } catch {
    holder.replaceChildren(el("p", { class: "muted" }, "The menu is unavailable right now. Please ask at the counter."));
  }
});
