import { db } from "@/db";
import { settings as settingsT } from "@/db/schema";
import { AppNav } from "@/components/AppNav";
import { updateSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const s = (await db.select().from(settingsT))[0] ?? null;
  return (
    <>
      <AppNav active="/settings" />
      <div className="screen">
        <h1>Настройки</h1>
        {saved && (
          <p style={{ color: "var(--green)", fontWeight: 700, marginTop: -8 }}>
            Запазено ✓
          </p>
        )}
        <form action={updateSettings} className="panel">
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Слоган</label>
            <textarea name="slogan" rows={2} defaultValue={s?.slogan ?? ""} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Адрес</label>
              <input name="address" defaultValue={s?.address ?? ""} />
            </div>
            <div className="field">
              <label>Телефон</label>
              <input name="phone" defaultValue={s?.phone ?? ""} />
            </div>
            <div className="field">
              <label>Facebook</label>
              <input name="facebook" defaultValue={s?.facebook ?? ""} />
            </div>
            <div className="field">
              <label>Работно време (раздели групите с „ · ")</label>
              <input name="workingHours" defaultValue={s?.workingHours ?? ""} />
            </div>
            <div className="field full">
              <label>Дисклеймър — лекарство (OTC)</label>
              <textarea name="disclaimerOtc" rows={2} defaultValue={s?.disclaimerOtc ?? ""} />
            </div>
            <div className="field full">
              <label>Дисклеймър — хранителна добавка</label>
              <textarea
                name="disclaimerSupplement"
                rows={2}
                defaultValue={s?.disclaimerSupplement ?? ""}
              />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn" type="submit">
              Запази настройките
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
