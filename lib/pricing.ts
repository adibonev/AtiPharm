import type { ProductType } from "./types";

/** Fixed BGN/EUR rate — mandatory dual display in 2026. */
export const RATE = 1.95583;

export const lev = (eur: number) => eur * RATE;
export const bg = (n: number) => n.toFixed(2).replace(".", ","); // 10.99 -> "10,99"
export const eurStr = (n: number) => bg(n) + " €";
export const levStr = (n: number) => bg(n) + " лв.";
export const pctOf = (oldEur: number, newEur: number) =>
  Math.round((1 - newEur / oldEur) * 100);

/** Auto-disclaimer by product type (spec §7). Only OTC drugs and supplements
 *  carry a mandatory disclaimer; cosmetic / medical_device / other carry none. */
export const DISCLAIMERS: Partial<Record<ProductType, string>> = {
  otc_drug:
    "Лекарствен продукт без лекарско предписание. Преди употреба прочетете листовката.",
  supplement:
    "Хранителната добавка не замества разнообразното и балансирано хранене.",
};

/** "14.06 – 13.07.2026" -> "14.06 – 13.07" (small per-card tag). */
export const periodShort = (period: string) => period.replace(/\.\d{4}/, "");

/** ("2026-06-14","2026-07-13") -> "14.06 – 13.07.2026". */
export function formatPeriod(from?: string, to?: string) {
  if (!from || !to) return "";
  const f = new Date(from);
  const t = new Date(to);
  if (isNaN(+f) || isNaN(+t)) return "";
  const d = (x: Date) =>
    String(x.getDate()).padStart(2, "0") + "." + String(x.getMonth() + 1).padStart(2, "0");
  return `${d(f)} – ${d(t)}.${t.getFullYear()}`;
}
