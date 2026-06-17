// Layout verification harness — mirrors components/Brochure.tsx DOM 1:1 with
// worst-case content (2-line titles + subs, full mandatory disclaimers,
// "Трайно ниска цена" cards) to check the compact 6-up page never clips text.
// Renders one 6-card page + one 4-card page into _layout-test.html, which links
// the real app/globals.css so the screenshot reflects the actual CSS.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RATE = 1.95583;
const lev = (e) => e * RATE;
const bg = (n) => n.toFixed(2).replace(".", ",");
const eurStr = (n) => bg(n) + " €";
const levStr = (n) => bg(n) + " лв.";
const pctOf = (o, n) => Math.round((1 - n / o) * 100);
const DISC = {
  otc_drug: "Лекарствен продукт без лекарско предписание. Преди употреба прочетете листовката.",
  supplement: "Хранителната добавка не замества разнообразното и балансирано хранене.",
};
const period = "14.06 – 13.07.2026";
const periodShort = (p) => p.replace(/\.\d{4}/, "");
const unitLabel = (u) => (u === "per_piece" ? "€/бр." : "€/оп.");

// The user's actual page-1 products (from the deployed screenshot). Mostly 1–2
// line names/subs — EASIER than worst-case, yet production clips them. So we
// reproduce the real render context (composer zoom:.6), not just the content.
const P = [
  { name: "Прокомбо", sub: "Пробиотик + пребиотик за чревния баланс", img: "procombo", type: "supplement", lowPrice: true, newEur: 10.99 },
  { name: "Тератур ПроНатурал сироп", sub: "За сухо и влажна кашлица за деца над 1 година", img: "tibanol", type: "otc_drug", lowPrice: true, newEur: 10.49 },
  { name: "Живи Витамини", sub: "Биоактивна формула — течност в капсула", img: "zhivi", type: "supplement", lowPrice: true, newEur: 10.29 },
  { name: "Центрум Beauty & Collagen капс. x 30", sub: "За коса, кожа и нокти", img: "magnezij", type: "supplement", oldEur: 16.99, newEur: 8.49 },
  { name: "Бонген Мега ампули x 16", sub: "За ставите, мускулите и костите", img: "magkombo", type: "supplement", oldEur: 28.19, newEur: 25.37 },
  { name: "Волтарен лечебен пластир", sub: "Облекчава болезнената зона за 24 часа", img: "nazik", type: "otc_drug", lowPrice: true, newEur: 16.29 },
];

function priceHTML(p) {
  if (p.percentOnly)
    return `<div class="price"><div class="pct"><b>-${p.percent}%</b><span>отстъпка</span></div></div>`;
  if (p.lowPrice)
    return `<div class="price"><div class="low-label">Трайно ниска цена</div><div class="now low">${eurStr(p.newEur)} <i>|</i> <span class="lv">${levStr(lev(p.newEur))}</span></div><span class="unit">${unitLabel(p.priceUnit)}</span></div>`;
  return `<div class="price"><div class="old strike">${eurStr(p.oldEur)} | ${levStr(lev(p.oldEur))}</div><div class="now">${eurStr(p.newEur)} <i>|</i> <span class="lv">${levStr(lev(p.newEur))}</span></div><span class="unit">${unitLabel(p.priceUnit)}</span></div>`;
}

function cardHTML(p) {
  const ribbon = !p.percentOnly && !p.lowPrice ? `<span class="ribbon ribbon--card">-${pctOf(p.oldEur, p.newEur)}%</span>` : "";
  return `<article class="card ${p.percentOnly ? "only" : ""}">
    <div class="card__media">${ribbon}<img src="../public/products/${p.img}.png" alt="${p.name}"></div>
    <div class="card__body">
      <h3>${p.name}</h3>
      <p class="sub">${p.sub}</p>
      ${priceHTML(p)}
      <div class="card__foot">
        <span class="period-tag">${periodShort(period)}</span>
        <p class="disc">${DISC[p.type] || ""}</p>
      </div>
    </div>
  </article>`;
}

function pageHTML(products, big, label) {
  const perPage = big ? 4 : 6;
  const fill = products.length === perPage;
  return `<section class="page page--products">
    <div class="page__safe">
      <header class="page-head">
        <img src="../public/logo.png" alt="Аптека Атифарм">
        <div class="meta">Брой №1 · <b>${period}</b> — ${label}</div>
      </header>
      <div class="grid ${big ? "grid--big" : ""} ${fill ? "grid--fill" : ""}">${products.map(cardHTML).join("")}</div>
    </div>
    <footer class="foot--slim">
      <span><b>Аптека Атифарм</b><span class="sep">·</span>ул. Любен Каравелов № 3А, Монтана 3400</span>
      <span>089 696 2299<span class="sep">·</span>FB: Аптека Атифарм<span class="sep">·</span>Пон–Пет: 7:30–22:30 · Съб–Нед: 8:30–20:30</span>
    </footer>
  </section>`;
}

const measure = `<script>
window.addEventListener('load', () => { setTimeout(() => {
  const safe = document.querySelector('.page--products .page__safe');
  const sb = safe.getBoundingClientRect().bottom;   // the line where the page clips (overflow:hidden)
  const page = document.querySelector('.page--products');
  const zoom = page.getBoundingClientRect().width / (210 * 96/25.4); // detect CSS zoom from page width
  const px2mm = (96/25.4) * zoom;
  const out = [];
  out.push('font: ' + getComputedStyle(document.querySelector('.card h3')).fontFamily.split(',')[0]);
  const cards = [...document.querySelectorAll('.card')];
  // headroom = gap between the lowest disclaimer and the page clip line
  let lowest = -Infinity;
  cards.forEach((card, i) => {
    const disc = card.querySelector('.disc');
    const db = disc.getBoundingClientRect().bottom;  // bottom of the disclaimer text
    lowest = Math.max(lowest, db);
    const over = (db - sb) / px2mm;                  // >0 => disclaimer past the clip line
    const clipped = db > sb + 0.5;
    if (clipped) { card.style.outline = '3px solid red'; card.style.outlineOffset = '-1px'; }
    const discLines = Math.round(disc.getBoundingClientRect().height / (parseFloat(getComputedStyle(disc).lineHeight)));
    out.push('card'+(i+1)+': disc '+discLines+'L, '+(over>0?'+':'')+over.toFixed(1)+'mm vs clip '+(clipped?'✂ CLIP':'ok'));
  });
  const headroom = (sb - lowest) / px2mm;
  const ch = cards[0].getBoundingClientRect().height / px2mm;
  out.unshift('HEADROOM: ' + headroom.toFixed(1) + 'mm  (card h≈' + ch.toFixed(0) + 'mm, zoom ' + zoom.toFixed(2) + ')');
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;top:4px;left:4px;z-index:99999;background:#111;color:#0f0;font:13px/1.6 monospace;padding:7px 11px;border-radius:6px;white-space:pre;box-shadow:0 2px 8px rgba(0,0,0,.4)';
  box.textContent = out.join('\\n');
  document.body.appendChild(box);
}, 300); });
</script>`;

const doc = (body, zoom) => `<!DOCTYPE html><html lang="bg"><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../app/globals.css">
<style>body{background:#d9ddd6}</style>
</head><body class="prem">${
  zoom ? `<div class="composer__preview"><div class="composer__preview-inner">${body}</div></div>` : body
}${measure}</body></html>`;

// Worst-case 6: 2-line names + 2-line subs + full disclaimers, to confirm
// space-evenly still never clips (free space stays positive).
const W = [
  { name: "Центрум Beauty & Collagen капс. x 30", sub: "За коса, кожа и нокти с биотин, цинк и колаген", img: "procombo", type: "supplement", oldEur: 16.99, newEur: 8.49 },
  { name: "Тератур ПроНатурал сироп за деца над 1г.", sub: "За сухо и влажна кашлица с екстракт от мащерка", img: "tibanol", type: "otc_drug", lowPrice: true, newEur: 10.49 },
  { name: "Магнезий Допелхерц Депо 2-фазни табл.", sub: "2-фазна таблетка ДЕПО, 500 mg за нервната система", img: "magnezij", type: "supplement", lowPrice: true, newEur: 6.99 },
  { name: "Волтарен Форте лечебен пластир 24 часа", sub: "Облекчава болезнената зона за 24 часа при болки", img: "magkombo", type: "otc_drug", lowPrice: true, newEur: 16.29 },
  { name: "Бонген Мега ампули за стави x 16 броя", sub: "За ставите, мускулите и костите при натоварване", img: "nazik", type: "supplement", oldEur: 28.19, newEur: 25.37 },
  { name: "Магне Д'оро Ликуид течни сашета x 20", sub: "Течни сашета за директен прием без вода навсякъде", img: "zhivi", type: "supplement", lowPrice: true, newEur: 6.99 },
];

for (const [file, body, zoom] of [
  ["_layout-6.html", pageHTML(P, false, "6 продукта (пълна) · fill"), false],
  ["_layout-4part.html", pageHTML(P.slice(0, 4), false, "4 продукта (непълна 6/стр) · fill"), false],
  ["_layout-6worst.html", pageHTML(W, false, "6 продукта · worst-case · fill"), false],
]) {
  const out = join(__dirname, file);
  writeFileSync(out, doc(body, zoom), "utf8");
  console.log("wrote", out);
}
