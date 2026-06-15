"use server";

import { db } from "@/db";
import { issues, issueProducts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** "Публикувай предишния брой": copy a past issue's products & prices into a
 *  brand-new issue, with priceConfirmed=false so the composer flags each price
 *  for confirmation. Then open the new issue in the composer. */
export async function publishFromIssue(sourceId: number) {
  const src = (await db.select().from(issues).where(eq(issues.id, sourceId)))[0];
  if (!src) redirect("/issues");

  const items = await db.select().from(issueProducts).where(eq(issueProducts.issueId, sourceId));
  const [created] = await db
    .insert(issues)
    .values({
      number: src.number + 1,
      periodFrom: src.periodFrom,
      periodTo: src.periodTo,
      freeText: src.freeText,
    })
    .returning();

  if (items.length) {
    await db.insert(issueProducts).values(
      items.map((it) => ({
        issueId: created.id,
        productId: it.productId,
        oldPriceEur: it.oldPriceEur,
        newPriceEur: it.newPriceEur,
        percentOnly: it.percentOnly,
        percent: it.percent,
        isHero: it.isHero,
        sortOrder: it.sortOrder,
        priceConfirmed: false, // <- needs confirmation in the composer
      }))
    );
  }

  redirect(`/composer?issue=${created.id}`);
}

export async function deleteIssue(id: number) {
  await db.delete(issueProducts).where(eq(issueProducts.issueId, id));
  await db.delete(issues).where(eq(issues.id, id));
  revalidatePath("/issues");
}
