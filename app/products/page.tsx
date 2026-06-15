import { db } from "@/db";
import { products as productsT } from "@/db/schema";
import { AppNav } from "@/components/AppNav";
import { createProduct, deleteProduct } from "./actions";

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
          <form action={createProduct} className="form-grid">
            <div className="field full">
              <label>Име *</label>
              <input name="name" required />
            </div>
            <div className="field full">
              <label>Подзаглавие</label>
              <input name="subtitle" placeholder="(по избор)" />
            </div>
            <div className="field">
              <label>Тип</label>
              <select name="type" defaultValue="supplement">
                <option value="supplement">Добавка</option>
                <option value="otc_drug">Лекарство (OTC)</option>
                <option value="cosmetic">Козметика</option>
                <option value="medical_device">Мед. изделие</option>
                <option value="other">Друго</option>
              </select>
            </div>
            <div className="field">
              <label>Мерна единица</label>
              <select name="priceUnit" defaultValue="per_pack">
                <option value="per_pack">лв./оп.</option>
                <option value="per_piece">лв./бр.</option>
              </select>
            </div>
            <div className="field full">
              <label>Снимка (чист пакшот, бял фон)</label>
              <input type="file" name="image" accept="image/*" />
            </div>
            <div className="full">
              <button className="btn" type="submit">
                Добави продукт
              </button>
            </div>
          </form>
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
