// Diagnose: can the server actually download a chosen Serper image?
// Run: NODE_OPTIONS=--use-system-ca node scripts/img-fetch-test.mjs
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const key = process.env.SERPER_API_KEY;
const res = await fetch("https://google.serper.dev/images", {
  method: "POST",
  headers: { "X-API-KEY": key, "Content-Type": "application/json" },
  body: JSON.stringify({ q: "аспирин протект", gl: "bg", hl: "bg", num: 4 }),
});
const data = await res.json();
const items = data.images || [];
console.log("results:", items.length);
for (const it of items.slice(0, 3)) {
  for (const [label, u] of [["imageUrl", it.imageUrl], ["thumbnailUrl", it.thumbnailUrl]]) {
    if (!u) { console.log(label, "(none)"); continue; }
    try {
      const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0" } });
      const buf = r.ok ? Buffer.from(await r.arrayBuffer()) : null;
      console.log(label, r.status, r.headers.get("content-type"), buf ? buf.length + "b" : "", "|", u.slice(0, 55));
    } catch (e) {
      console.log(label, "THREW", e?.cause?.code || e?.message, "|", u.slice(0, 55));
    }
  }
}
