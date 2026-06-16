import { db } from "@/db";
import {
  products as productsT,
  settings as settingsT,
  issues as issuesT,
  issueProducts as ipT,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Composer, type ComposerInitial } from "@/components/Composer";

export const dynamic = "force-dynamic"; // always read fresh from the DB

export default async function ComposerPage({
  searchParams,
}: {
  searchParams: Promise<{ issue?: string; copyFrom?: string }>;
}) {
  const { issue: issueIdStr, copyFrom: copyFromStr } = await searchParams;
  const catalog = await db.select().from(productsT).orderBy(productsT.id);
  const s = (await db.select().from(settingsT))[0] ?? null;
  const allIssues = await db
    .select({
      id: issuesT.id,
      number: issuesT.number,
      periodFrom: issuesT.periodFrom,
      periodTo: issuesT.periodTo,
    })
    .from(issuesT)
    .orderBy(desc(issuesT.id));

  const editId = issueIdStr ? Number(issueIdStr) : undefined;
  const copyId = copyFromStr ? Number(copyFromStr) : undefined;
  const srcId = editId ?? copyId;

  let initial: ComposerInitial | undefined;
  if (srcId) {
    const iss = (await db.select().from(issuesT).where(eq(issuesT.id, srcId)))[0];
    if (iss) {
      const items = (await db.select().from(ipT).where(eq(ipT.issueId, srcId))).sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );
      const rows: ComposerInitial["rows"] = {};
      const order: number[] = [];
      for (const it of items) {
        order.push(it.productId);
        rows[it.productId] = {
          included: true,
          oldEur: it.oldPriceEur ?? "",
          newEur: it.newPriceEur ?? "",
          percentOnly: it.percentOnly,
          lowPrice: it.lowPrice,
          percent: it.percent != null ? String(it.percent) : "",
          isHero: it.isHero,
          // when copying into a NEW issue, prices need confirmation (yellow marker)
          confirmed: copyId ? false : it.priceConfirmed,
        };
      }
      initial = {
        issueId: editId, // undefined when copying -> Save creates a new issue
        number: copyId ? String(iss.number + 1) : String(iss.number),
        from: iss.periodFrom ?? "",
        to: iss.periodTo ?? "",
        freeText: iss.freeText ?? "",
        rows,
        order,
      };
    }
  }

  return <Composer catalog={catalog} settings={s} issues={allIssues} initial={initial} />;
}
