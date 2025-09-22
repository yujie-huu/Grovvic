// src/check.js
// Usage: node src/check.js

const fs = require("fs/promises");
const path = require("path");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const url = "https://netzero-vigrow-api.duckdns.org/iter2/species/animals/flags";
const outFile = path.resolve(__dirname, "data/vernacular_orders.json");

(async () => {
  try {
    const res = await fetch(url, { timeout: 30000 });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();

    const categories = { animals: [], pollinators: [], pests_and_weeds: [] };

    data.forEach(item => {
      const order = String(item?.vernacular_order || "").trim();
      if (!order) return;

      if (item.animals === "T") categories.animals.push(order);
      if (item.pollinators === "T") categories.pollinators.push(order);
      if (item.pests_and_weeds === "T") categories.pests_and_weeds.push(order);
    });

    const result = {};
    Object.keys(categories).forEach(cat => {
      result[cat] = [...new Set(categories[cat])]
        .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    });

    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, JSON.stringify(result, null, 2), "utf-8");

    console.log("✔ Saved:", outFile);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
