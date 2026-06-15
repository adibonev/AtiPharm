import { Brochure } from "@/components/Brochure";
import { BrochureToolbar } from "@/components/BrochureToolbar";
import type { IssueData, FeaturedProduct, CardProduct } from "@/lib/types";

// Sample data = the current real issue. In Phase 2 this comes from the DB
// (the composer drives the same <Brochure /> component as the live preview).
const issue: IssueData = {
  no: "Брой №1",
  period: "14.06 – 13.07.2026",
  slogan:
    "Очакваме ви в аптеката, където професионализмът среща личното отношение.",
  contacts: {
    address: "ул. Любен Каравелов № 3А, Монтана 3400",
    phone: "089 696 2299",
    facebook: "Аптека Атифарм",
    hours: "Пон–Пет: 7:30–22:30 · Съб–Нед: 8:30–20:30",
  },
};

const featured: FeaturedProduct = {
  name: "Прокомбо",
  sub: "Пробиотик + пребиотик за чревния баланс",
  tag: "Пробиотик + пребиотик",
  img: "/products/procombo.png",
  type: "supplement",
  oldEur: 13.99,
  newEur: 10.99,
  unitNote: "за опаковка · лв./оп.",
};

const products: CardProduct[] = [
  { name: "Тибанол", sub: "Имунна защита с лактоферин", img: "/products/tibanol.png", type: "supplement", oldEur: 15.75, newEur: 13.39 },
  { name: "Живи Витамини", sub: "Биоактивна формула — течност в капсула", img: "/products/zhivi.png", type: "supplement", oldEur: 13.19, newEur: 10.29 },
  { name: "Магнезий Допелхерц", sub: "2-фазна таблетка ДЕПО, 500 mg", img: "/products/magnezij.png", type: "supplement", percentOnly: true, percent: 15 },
  { name: "Магкомбо", sub: "Магнезий комплекс — усвояване над 90%", img: "/products/magkombo.png", type: "supplement", oldEur: 9.99, newEur: 6.99 },
  { name: "Назик", sub: "Спрей за нос при хрема и ринит — възрастни", img: "/products/nazik.png", type: "otc_drug", oldEur: 7.99, newEur: 6.39 },
  { name: "Назик кидс", sub: "Спрей за нос за деца над 2 г.", img: "/products/nazik_kids.png", type: "otc_drug", oldEur: 5.69, newEur: 4.69 },
];

export default function PreviewPage() {
  return (
    <>
      <BrochureToolbar />
      <Brochure issue={issue} featured={featured} products={products} />
    </>
  );
}
