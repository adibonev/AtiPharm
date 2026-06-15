import { db } from "@/db";
import { products as productsT } from "@/db/schema";
import { AppNav } from "@/components/AppNav";
import { ProductForm } from "@/components/ProductForm";
import { deleteProduct } from "./actions";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  otc_drug: "Лекарство (OTC)",
  supplement: "Добавка",
  cosmetic: "Козметика",
  medical_device: "Мед. изделие",
  other: "Друго",
};

export default async function ProductsPage() {
  const list = await db.select().from(productsT).orderBy(productsT.id);
  return (
    <>
      <AppNav active="/products" />
      <div className="screen">
        <h1>Продукти ({list.length})</h1>

        <div className="panel">
          <h2>Нов продукт</h2>
          <ProductForm />
        </div>

        <div className="prodlist">
          {list.map((p) => (
            <div className="item" key={p.id}>
              <div className="ph">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} />
                ) : (
                  <span style={{ color: "#aaa", fontSize: 12 }}>няма снимка</span>
                )}
              </div>
              <div className="meta">
                <span className="type">{TYPE_LABELS[p.type] ?? p.type}</span>
                <b>{p.name}</b>
                {p.subtitle && <small>{p.subtitle}</small>}
              </div>
              <form action={deleteProduct}>
                <input type="hidden" name="id" value={p.id} />
                <button className="btn-danger" type="submit">
                  Изтрий
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
