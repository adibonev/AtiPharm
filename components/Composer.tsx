"use client";

import { useState } from "react";
import { Brochure } from "./Brochure";
import { AppNav } from "./AppNav";
import { formatPeriod, DISCLAIMERS } from "@/lib/pricing";
import { saveIssue, getIssueForCopy } from "@/app/composer/actions";
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
  lowPrice: boolean;
  percent: string;
  isHero: boolean;
  confirmed: boolean;
};
const emptyRow = (): Row => ({
  included: false,
  oldEur: "",
  newEur: "",
  percentOnly: false,
  lowPrice: false,
  percent: "",
  isHero: false,
  confirmed: true,
});
const num = (s: string) => (s.trim() ? parseFloat(s.replace(",", ".")) : undefined);

type IssueRow = { id: number; number: number; periodFrom: string | null; periodTo: string | null };

export interface ComposerInitial {
  issueId?: number;
  number: string;
  from: string;
  to: string;
  freeText: string;
  rows: Record<number, Row>;
  order: number[];
}

export function Composer({
  catalog,
  settings,
  issues,
  initial,
}: {
  catalog: DbProduct[];
  settings: DbSettings;
  issues: IssueRow[];
  initial?: ComposerInitial;
}) {
  const [number, setNumber] = useState(initial?.number ?? "1");
  const [from, setFrom] = useState(initial?.from || "2026-06-14");
  const [to, setTo] = useState(initial?.to || "2026-07-13");
  const [rows, setRows] = useState<Record<number, Row>>(() => {
    const base: Record<number, Row> = Object.fromEntries(
      catalog.map((p) => [p.id, emptyRow()])
    );
    if (initial) {
      for (const [k, v] of Object.entries(initial.rows)) base[Number(k)] = { ...emptyRow(), ...v };
    }
    return base;
  });
  const [order, setOrder] = useState<number[]>(initial?.order ?? []);
  const [dragId, setDragId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | undefined>(initial?.issueId);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterText, setFilterText] = useState("");
  const [copiedFrom, setCopiedFrom] = useState("");

  const patch = (id: number, p: Partial<Row>) =>
    setRows((r) => ({ ...r, [id]: { ...r[id], ...p } }));
  const setHero = (id: number) =>
    setRows((r) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { ...v, isHero: Number(k) === id }]))
    );
  const priceEdit = (id: number, p: Partial<Row>) => patch(id, { ...p, confirmed: true });

  function toggleInclude(id: number, checked: boolean) {
    patch(id, { included: checked });
    setOrder((o) => (checked ? (o.includes(id) ? o : [...o, id]) : o.filter((x) => x !== id)));
  }
  function move(id: number, dir: -1 | 1) {
    setOrder((o) => {
      const a = [...o];
      const i = a.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= a.length) return o;
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });
  }
  async function onCopy(id: number) {
    const data = await getIssueForCopy(id);
    if (!data) return;
    setRows(() => {
      const base: Record<number, Row> = Object.fromEntries(
        catalog.map((p) => [p.id, emptyRow()])
      );
      for (const it of data.items) {
        base[it.productId] = {
          included: true,
          oldEur: it.oldEur,
          newEur: it.newEur,
          percentOnly: it.percentOnly,
          lowPrice: it.lowPrice,
          percent: it.percent,
          isHero: it.isHero,
          confirmed: false, // copied prices need confirmation
        };
      }
      return base;
    });
    setOrder(data.items.map((it) => it.productId));
    setNumber(String(data.number + 1));
    setFrom(data.from);
    setTo(data.to);
    setSavedId(undefined);
  }
  function onDragOver(e: React.DragEvent, overId: number) {
    e.preventDefault();
    if (dragId == null || dragId === overId) return;
    setOrder((o) => {
      const a = [...o];
      const from2 = a.indexOf(dragId);
      const to2 = a.indexOf(overId);
      if (from2 < 0 || to2 < 0) return o;
      a.splice(from2, 1);
      a.splice(to2, 0, dragId);
      return a;
    });
  }

  const priced = (r: Row) =>
    r.percentOnly
      ? !!r.percent.trim()
      : r.lowPrice
        ? !!r.newEur.trim()
        : !!r.oldEur.trim() && !!r.newEur.trim();

  const toCard = (p: DbProduct): CardProduct => {
    const r = rows[p.id];
    return {
      name: p.name,
      sub: p.subtitle ?? undefined,
      img: p.imageUrl ?? "",
      type: p.type as ProductType,
      priceUnit: p.priceUnit as "per_pack" | "per_piece",
      oldEur: num(r.oldEur),
      newEur: num(r.newEur),
      percentOnly: r.percentOnly || undefined,
      lowPrice: r.lowPrice || undefined,
      percent: r.percent ? parseInt(r.percent) : undefined,
    };
  };

  const visibleCatalog = catalog.filter(
    (p) =>
      (!filterType || p.type === filterType) &&
      (!filterText || p.name.toLowerCase().includes(filterText.toLowerCase()))
  );

  // products of the issue, in manual order
  const includedOrdered = order
    .map((id) => catalog.find((p) => p.id === id))
    .filter((p): p is DbProduct => !!p && rows[p.id]?.included);
  const renderable = includedOrdered.filter((p) => priced(rows[p.id]));
  const heroP = renderable.find((p) => rows[p.id].isHero) ?? renderable[0];
  const featured: FeaturedProduct | null = heroP
    ? {
        ...toCard(heroP),
        tag: heroP.subtitle ?? undefined,
        unitNote: heroP.priceUnit === "per_piece" ? "за брой · €/бр." : "за опаковка · €/оп.",
      }
    : null;
  const gridProducts = renderable.filter((p) => p !== heroP).map(toCard);

  const disclaimers = {
    otc_drug: settings?.disclaimerOtc ?? DISCLAIMERS.otc_drug,
    supplement: settings?.disclaimerSupplement ?? DISCLAIMERS.supplement,
  };

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

  async function onSave() {
    setSaving(true);
    setSavedMsg("");
    const items = includedOrdered.map((p, i) => {
      const r = rows[p.id];
      return {
        productId: p.id,
        oldPriceEur: num(r.oldEur),
        newPriceEur: num(r.newEur),
        percentOnly: r.percentOnly,
        lowPrice: r.lowPrice,
        percent: r.percent ? parseInt(r.percent) : undefined,
        isHero: heroP?.id === p.id,
        sortOrder: i,
      };
    });
    try {
      const res = await saveIssue({
        issueId: savedId,
        number: parseInt(number) || 1,
        periodFrom: from,
        periodTo: to,
        freeText: "",
        items,
      });
      if (res.ok) {
        setSavedId(res.id);
        setSavedMsg(`Запазено (брой #${res.id})`);
      }
    } catch {
      setSavedMsg("Грешка при запис");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="composer-wrap">
      <AppNav active="/composer" />
      <div className="composer">
      <div className="composer__editor screen-only">
        <h2>{savedId ? `Брой #${savedId}` : "Нов брой"}</h2>
        {!savedId && issues.length > 0 && (
          <div className="composer__field" style={{ marginBottom: 12 }}>
            <label>Копирай от стар брой</label>
            <select
              value={copiedFrom}
              onChange={(e) => {
                const v = e.target.value;
                setCopiedFrom(v);
                if (v) onCopy(Number(v));
              }}
            >
              <option value="">— нов празен брой —</option>
              {issues.map((i) => (
                <option key={i.id} value={i.id}>
                  Брой №{i.number} · {i.periodFrom}–{i.periodTo}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="composer__field">
          <label>Брой №</label>
          <input value={number} onChange={(e) => setNumber(e.target.value)} />
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
        <div className="composer__filters">
          <input
            placeholder="🔍 търси по име"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Всички типове</option>
            <option value="supplement">Добавки</option>
            <option value="otc_drug">Лекарства (OTC)</option>
            <option value="cosmetic">Козметика</option>
            <option value="medical_device">Мед. изделия</option>
            <option value="other">Други</option>
          </select>
        </div>
        <div className="composer__products">
          {visibleCatalog.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 2px" }}>Няма съвпадения.</p>
          )}
          {visibleCatalog.map((p) => {
            const r = rows[p.id];
            const unconfirmed = r.included && !r.confirmed;
            return (
              <div
                className={`composer__prod ${r.included ? "on" : ""} ${unconfirmed ? "unconfirmed" : ""}`}
                key={p.id}
              >
                <div className="top">
                  <input
                    type="checkbox"
                    checked={r.included}
                    onChange={(e) => toggleInclude(p.id, e.target.checked)}
                  />
                  <b>{p.name}</b>
                  {r.included && (
                    <label style={{ fontSize: 12, color: "var(--muted)" }}>
                      <input type="radio" name="hero" checked={heroP?.id === p.id} onChange={() => setHero(p.id)} /> акцент
                    </label>
                  )}
                </div>
                {r.included && (
                  <>
                    {r.percentOnly ? (
                      <div className="grid2">
                        <input placeholder="−% отстъпка" value={r.percent} onFocus={() => priceEdit(p.id, {})} onChange={(e) => priceEdit(p.id, { percent: e.target.value })} />
                        <span />
                      </div>
                    ) : r.lowPrice ? (
                      <div className="grid2">
                        <input placeholder="цена €" value={r.newEur} onFocus={() => priceEdit(p.id, {})} onChange={(e) => priceEdit(p.id, { newEur: e.target.value })} />
                        <span />
                      </div>
                    ) : (
                      <div className="grid2">
                        <input placeholder="стара €" value={r.oldEur} onFocus={() => priceEdit(p.id, {})} onChange={(e) => priceEdit(p.id, { oldEur: e.target.value })} />
                        <input placeholder="нова €" value={r.newEur} onFocus={() => priceEdit(p.id, {})} onChange={(e) => priceEdit(p.id, { newEur: e.target.value })} />
                      </div>
                    )}
                    {unconfirmed && <div className="confirm-flag">цена от предишен брой — потвърди</div>}
                    <div className="opts">
                      <label>
                        <input type="checkbox" checked={r.percentOnly} onChange={(e) => patch(p.id, { percentOnly: e.target.checked, lowPrice: e.target.checked ? false : r.lowPrice })} /> само −%
                      </label>
                      <label>
                        <input type="checkbox" checked={r.lowPrice} onChange={(e) => patch(p.id, { lowPrice: e.target.checked, percentOnly: e.target.checked ? false : r.percentOnly })} /> трайно ниска
                      </label>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {includedOrdered.length > 1 && (
          <>
            <h2 style={{ marginTop: 16 }}>Подредба <small style={{ fontWeight: 500, color: "var(--muted)", fontSize: 12 }}>(влачи или ↑↓)</small></h2>
            <div className="orderlist">
              {includedOrdered.map((p, i) => (
                <div
                  key={p.id}
                  className={`orderlist__item ${dragId === p.id ? "drag" : ""}`}
                  draggable
                  onDragStart={() => setDragId(p.id)}
                  onDragOver={(e) => onDragOver(e, p.id)}
                  onDragEnd={() => setDragId(null)}
                >
                  <span className="handle">⠿</span>
                  <span className="nm">{i + 1}. {p.name}{heroP?.id === p.id ? " · акцент" : ""}</span>
                  <button type="button" onClick={() => move(p.id, -1)} disabled={i === 0}>↑</button>
                  <button type="button" onClick={() => move(p.id, 1)} disabled={i === includedOrdered.length - 1}>↓</button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="composer__bar">
          <button className="btn-print" onClick={() => window.print()}>🖨 Печат / PDF</button>
          <button className="btn-save" onClick={onSave} disabled={saving}>{saving ? "Запазвам…" : "Запази брой"}</button>
        </div>
        {savedMsg && <p style={{ color: "var(--green)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>{savedMsg}</p>}
      </div>

      <div className="composer__preview">
        {featured ? (
          <div className="composer__preview-inner">
            <Brochure issue={issue} featured={featured} products={gridProducts} disclaimers={disclaimers} />
          </div>
        ) : (
          <div className="composer__empty">Избери продукти и въведи цени отляво, за да се появи брошурата.</div>
        )}
      </div>
      </div>
    </div>
  );
}
