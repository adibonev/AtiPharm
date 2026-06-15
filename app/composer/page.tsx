import { db } from "@/db";
import {
  products as productsT,
  settings as settingsT,
  issues as issuesT,
  issueProducts as ipT,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { Composer, type ComposerInitial } from "@/components/Composer";

export const dynamic = "force-dynamic"; // always read fresh from the DB

export default async function ComposerPage({
  searchParams,
}: {
  searchParams: Promise<{ issue?: string }>;
}) {
  const { issue: issueIdStr } = await searchParams;
  const catalog = await db.select().from(productsT).orderBy(productsT.id);
  const s = (await db.select().from(settingsT))[0] ?? null;

  let initial: ComposerInitial | undefined;
  const issueId = issueIdStr ? Number(issueIdStr) : undefined;
  if (issueId) {
    const iss = (await db.select().from(issuesT).where(eq(issuesT.id, issueId)))[0];
    if (iss) {
      const items = await db.select().from(ipT).where(eq(ipT.issueId, issueId));
      const rows: ComposerInitial["rows"] = {};
      for (const it of items) {
        rows[it.productId] = {
          included: true,
          oldEur: it.oldPriceEur ?? "",
          newEur: it.newPriceEur ?? "",
          percentOnly: it.percentOnly,
          percent: it.percent != null ? String(it.percent) : "",
          isHero: it.isHero,
          confirmed: it.priceConfirmed,
        };
      }
      initial = {
        issueId,
        number: String(iss.number),
        from: iss.periodFrom ?? "",
        to: iss.periodTo ?? "",
        freeText: iss.freeText ?? "",
        rows,
      };
    }
  }

  return <Composer catalog={catalog} settings={s} initial={initial} />;
}
