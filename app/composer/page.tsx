import { db } from "@/db";
import { products as productsT, settings as settingsT } from "@/db/schema";
import { Composer } from "@/components/Composer";

export const dynamic = "force-dynamic"; // always read fresh from the DB

export default async function ComposerPage() {
  const catalog = await db.select().from(productsT).orderBy(productsT.id);
  const s = (await db.select().from(settingsT))[0] ?? null;
  return <Composer catalog={catalog} settings={s} />;
}
