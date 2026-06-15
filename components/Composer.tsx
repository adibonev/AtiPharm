"use client";

import { useState } from "react";
import { Brochure } from "./Brochure";
import { formatPeriod, DISCLAIMERS } from "@/lib/pricing";
import { saveIssue } from "@/app/composer/actions";
import type { IssueData, CardProduct, FeaturedProduct, ProductType } from "@/lib/types";

type DbProduct = {
  id: number;
  name: string;
  subtitle: string | null;
  imageUrl: string | null;
  type: string;
  priceUnit: string;
};
type DbSettings = {
  slogan: string | null;
  address: string | null;
  phone: string | null;
  facebook: string | null;
  workingHours: string | null;
  disclaimerOtc: string | null;
  disclaimerSupplement: string | null;
} | null;

type Row = {
  included: boolean;
  oldEur: string;
  newEur: string;
  percentOnly: boolean;
  percent: string;
  isHero: boolean;
};
const emptyRow = (): Row => ({
  included: false,
  oldEur: "",
  newEur: "",
  percentOnly: false,
  percent: "",
  isHero: false,
});
const num = (s: string) => (s.trim() ? parseFloat(s.replace(",", ".")) : undefined);

export function Composer({
  catalog,
  settings,
}: {
  catalog: DbProduct[];
  settings: DbSettings;
}) {
  const [number, setNumber] = useState("1");
  const [from, setFrom] = useState("2026-06-14");
  const [to, setTo] = useState("2026-07-13");
  const [freeText, setFreeText] = useState("");
  const [rows, setRows] = useState<Record<number, Row>>(() =>
    Object.fromEntries(catalog.map((p) => [p.id, emptyRow()]))
  );
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const patch = (id: number, p: Partial<Row>) =>
    setRows((r) => ({ ...r, [id]: { ...r[id], ...p } }));
  const setHero = (id: number) =>
    setRows((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, { ...v, isHero: Number(k) === id }])
      )
    );

  const priced = (r: Row) =>
    r.percentOnly ? !!r.percent.trim() : !!r.oldEur.trim() && !!r.newEur.trim();

  const toCard = (p: DbProduct): CardProduct => {
    const r = rows[p.id];
    return {
      name: p.name,
      sub: p.subtitle ?? undefined,
      img: p.imageUrl ?? "",
      type: p.type as ProductType,
      oldEur: num(r.oldEur),
      newEur: num(r.newEur),
      percentOnly: r.percentOnly || undefined,
      percent: r.percent ? parseInt(r.percent) : undefined,
    };
  };

  const included = catalog.filter((p) => rows[p.id].included);
  const renderable = included.filter((p) => priced(rows[p.id]));
  const heroP = renderable.find((p) => rows[p.id].isHero) ?? renderable[0];
  const featured: FeaturedProduct | null = heroP
    ? { ...toCard(heroP), tag: heroP.subtitle ?? undefined, unitNote: "за опаковка · лв./оп." }
    : null;
  const gridProducts = renderable.filter((p) => p !== heroP).map(toCard);

  const issue: IssueData = {
    no: `Брой №${number || "1"}`,
    period: formatPeriod(from, to),
    slogan: settings?.slogan ?? "",
    contacts: {
      address: settings?.address ?? "",
      phone: settings?.phone ?? "",
      facebook: settings?.facebook ?? "",
      hours: settings?.workingHours ?? "",
    },
  };

  const disclaimers = {
    otc_drug: settings?.disclaimerOtc ?? DISCLAIMERS.otc_drug,
    supplement: settings?.disclaimerSupplement ?? DISCLAIMERS.supplement,
  };

  async function onSave() {
    setSaving(true);
    setSavedMsg("");
    const items = included.map((p, i) => {
      const r = rows[p.id];
      return {
        productId: p.id,
        oldPriceEur: num(r.oldEur),
        newPriceEur: num(r.newEur),
        percentOnly: r.percentOnly,
        percent: r.percent ? parseInt(r.percent) : undefined,
        isHero: heroP?.id === p.id,
        sortOrder: i,
      };
    });
    try {
      const res = await saveIssue({
        number: parseInt(number) || 1,
        periodFrom: from,
        periodTo: to,
        freeText,
        items,
      });
      setSavedMsg(res.ok ? `Запазено (брой #${res.id})` : "Грешка при запис");
    } catch {
      setSavedMsg("Грешка при запис");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="composer">
      <div className="composer__editor screen-only">
        <div className="composer__nav">
          <a href="/composer">Композитор</a>
          <a href="/products">Продукти</a>
          <a href="/settings">Настройки</a>
          <form action="/api/logout" method="post">
            <button type="submit">Изход</button>
          </form>
        </div>

        <h2>Нов брой</h2>
        <div className="composer__row2">
          <div className="composer__field">
            <label>Брой №</label>
            <input value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="composer__field">
            <label>Свободен текст</label>
            <input
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="(по избор)"
            />
          </div>
        </div>
        <div className="composer__row2">
          <div className="composer__field">
            <label>Период от</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="composer__field">
            <label>Период до</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <h2 style={{ marginTop: 16 }}>Продукти</h2>
        <div className="composer__products">
          {catalog.map((p) => {
            const r = rows[p.id];
            return (
              <div className={`composer__prod ${r.included ? "on" : ""}`} key={p.id}>
                <div className="top">
                  <input
                    type="checkbox"
                    checked={r.included}
                    onChange={(e) => patch(p.id, { included: e.target.checked })}
                  />
                  <b>{p.name}</b>
                  {r.included && (
                    <label style={{ fontSize: 12, color: "var(--muted)" }}>
                      <input
                        type="radio"
                        name="hero"
                        checked={heroP?.id === p.id}
                        onChange={() => setHero(p.id)}
                      />{" "}
                      акцент
                    </label>
                  )}
                </div>
                {r.included && (
                  <>
                    {!r.percentOnly ? (
                      <div className="grid2">
                        <input
                          placeholder="стара €"
                          value={r.oldEur}
                          onChange={(e) => patch(p.id, { oldEur: e.target.value })}
                        />
                        <input
                          placeholder="нова €"
                          value={r.newEur}
                          onChange={(e) => patch(p.id, { newEur: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div className="grid2">
                        <input
                          placeholder="−% отстъпка"
                          value={r.percent}
                          onChange={(e) => patch(p.id, { percent: e.target.value })}
                        />
                        <span />
                      </div>
                    )}
                    <div className="opts">
                      <label>
                        <input
                          type="checkbox"
                          checked={r.percentOnly}
                          onChange={(e) => patch(p.id, { percentOnly: e.target.checked })}
                        />{" "}
                        само −% (без цени)
                      </label>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="composer__bar">
          <button className="btn-print" onClick={() => window.print()}>
            🖨 Печат / PDF
          </button>
          <button className="btn-save" onClick={onSave} disabled={saving}>
            {saving ? "Запазвам…" : "Запази брой"}
          </button>
        </div>
        {savedMsg && (
          <p style={{ color: "var(--green)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
            {savedMsg}
          </p>
        )}
      </div>

      <div className="composer__preview">
        {featured ? (
          <div className="composer__preview-inner">
            <Brochure
              issue={issue}
              featured={featured}
              products={gridProducts}
              disclaimers={disclaimers}
            />
          </div>
        ) : (
          <div className="composer__empty">
            Избери продукти и въведи цени отляво, за да се появи брошурата.
          </div>
        )}
      </div>
    </div>
  );
}
