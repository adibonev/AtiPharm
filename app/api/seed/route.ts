import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, settings } from "@/db/schema";

// Idempotent seed: default settings + the current 7 products. Safe to call twice.
const DEFAULT_SETTINGS = {
  slogan:
    "Очакваме ви в аптеката, където професионализмът среща личното отношение.",
  address: "ул. Любен Каравелов № 3А, Монтана 3400",
  phone: "089 696 2299",
  facebook: "Аптека Атифарм",
  workingHours: "Пон–Пет: 7:30–22:30 · Съб–Нед: 8:30–20:30",
  disclaimerOtc:
    "Лекарствен продукт без лекарско предписание. Преди употреба прочетете листовката.",
  disclaimerSupplement:
    "Хранителната добавка не замества разнообразното и балансирано хранене.",
};

const SEED_PRODUCTS = [
  { name: "Прокомбо", subtitle: "Пробиотик + пребиотик за чревния баланс", imageUrl: "/products/procombo.png", type: "supplement", priceUnit: "per_pack" },
  { name: "Тибанол", subtitle: "Имунна защита с лактоферин", imageUrl: "/products/tibanol.png", type: "supplement", priceUnit: "per_pack" },
  { name: "Живи Витамини", subtitle: "Биоактивна формула — течност в капсула", imageUrl: "/products/zhivi.png", type: "supplement", priceUnit: "per_pack" },
  { name: "Магнезий Допелхерц", subtitle: "2-фазна таблетка ДЕПО, 500 mg", imageUrl: "/products/magnezij.png", type: "supplement", priceUnit: "per_pack" },
  { name: "Магкомбо", subtitle: "Магнезий комплекс — усвояване над 90%", imageUrl: "/products/magkombo.png", type: "supplement", priceUnit: "per_pack" },
  { name: "Назик", subtitle: "Спрей за нос при хрема и ринит — възрастни", imageUrl: "/products/nazik.png", type: "otc_drug", priceUnit: "per_pack" },
  { name: "Назик кидс", subtitle: "Спрей за нос за деца над 2 г.", imageUrl: "/products/nazik_kids.png", type: "otc_drug", priceUnit: "per_pack" },
] as const;

export async function POST() {
  const existingProducts = await db.select().from(products);
  if (existingProducts.length === 0) {
    await db.insert(products).values(SEED_PRODUCTS as never);
  }
  const existingSettings = await db.select().from(settings);
  if (existingSettings.length === 0) {
    await db.insert(settings).values(DEFAULT_SETTINGS);
  }
  const all = await db.select().from(products);
  return NextResponse.json({ ok: true, products: all.length });
}
