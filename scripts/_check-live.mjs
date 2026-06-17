// Fetch the live site and report whether the served CSS is the NEW compact fix
// (compact media 32mm / big 44mm) or the OLD build (37mm / 54mm).
// Run: NODE_OPTIONS=--use-system-ca node scripts/_check-live.mjs https://atipharm-five.vercel.app
const base = (process.argv[2] || "https://atipharm-five.vercel.app").replace(/\/$/, "");

async function main() {
  const pageUrl = base + "/preview";
  const res = await fetch(pageUrl, { redirect: "follow" });
  const html = await res.text();
  const cssPaths = [...html.matchAll(/\/_next\/static\/css\/[^"']+\.css/g)].map((m) => m[0]);
  console.log("page:", pageUrl, "->", res.status);
  console.log("css chunks:", cssPaths.length ? cssPaths : "(none found)");

  let all = "";
  for (const p of [...new Set(cssPaths)]) {
    const c = await fetch(base + p);
    all += await c.text();
  }
  const has = (s) => all.includes(s);
  // Build markers:
  //   compact fix (bca0e2a):  32mm media, grid--fill class
  //   fill fix   (bedda54):   :not(.grid--fill) selector (rows fill the sheet)
  const compactFix = has("32mm") || has("grid--fill");
  const fillFix = has(":not(.grid--fill)");
  const verdict = fillFix
    ? "🟢 FILL fix is LIVE (rows distributed; empty band gone)"
    : compactFix
      ? "🟡 compact fix live, but FILL fix NOT yet deployed (build pending?)"
      : has("37mm")
        ? "🔴 OLD build still live"
        : "⚠ inconclusive";
  console.log({
    css_chunks: [...new Set(cssPaths)],
    compact_32mm: has("32mm"),
    grid_fill_class: has("grid--fill"),
    fill_fix_not_selector: fillFix,
    old_37mm: has("37mm"),
  });
  console.log(verdict);
}
main().catch((e) => {
  console.error("FETCH FAILED:", e.message);
  process.exit(1);
});
