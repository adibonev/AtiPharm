"use client";

import { useState } from "react";
import { createProduct, searchImages, type ImageResult } from "@/app/products/actions";

export function ProductForm() {
  const [name, setName] = useState("");
  const [results, setResults] = useState<ImageResult[]>([]);
  const [chosen, setChosen] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function onSearch() {
    if (!name.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      setResults(await searchImages(name));
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  return (
    <form action={createProduct} className="form-grid">
      <div className="field full">
        <label>Име *</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="button" className="btn-light" onClick={onSearch} disabled={searching}>
            {searching ? "Търся…" : "🔍 Намери снимка"}
          </button>
        </div>
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

      {(results.length > 0 || (searched && !searching)) && (
        <div className="full">
          <label className="imgsearch-label">
            {results.length > 0 ? "Избери снимка:" : "Няма резултати — качи файл по-долу."}
          </label>
          {results.length > 0 && (
            <div className="imgsearch">
              {results.map((r) => (
                <button
                  type="button"
                  key={r.url}
                  className={`imgsearch__item ${chosen === r.url ? "sel" : ""}`}
                  onClick={() => setChosen(r.url)}
                  title="Избери тази снимка"
                >
                  <img src={r.thumb} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {chosen && <input type="hidden" name="imageUrlExternal" value={chosen} />}

      <div className="field full">
        <label>…или качи файл (чист пакшот, бял фон)</label>
        <input type="file" name="image" accept="image/*" />
      </div>

      <div className="full">
        <button className="btn" type="submit">
          Добави продукт
        </button>
      </div>
    </form>
  );
}
