// Replicates the app's searchImages fetch exactly (Node fetch, UTF-8 JSON).
// Run: NODE_OPTIONS=--use-system-ca node scripts/serper-test.mjs
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const key = process.env.SERPER_API_KEY;
console.log("key present:", !!key, key ? key.slice(0, 8) + "…" : "");
try {
  const res = await fetch("https://google.serper.dev/images", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: "Прокомбо пробиотик", gl: "bg", hl: "bg", num: 6 }),
  });
  console.log("status:", res.status);
  const data = await res.json();
  console.log("images:", (data.images || []).length);
  if (data.message) console.log("message:", data.message);
} catch (e) {
  console.log("FETCH THREW:", e?.cause?.code || e?.code || e?.message);
}
