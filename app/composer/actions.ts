"use server";

import { db } from "@/db";
import { issues, issueProducts } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface SaveIssueItem {
  productId: number;
  oldPriceEur?: number;
  newPriceEur?: number;
  percentOnly: boolean;
  percent?: number;
  isHero: boolean;
  sortOrder: number;
}

export interface SaveIssueInput {
  issueId?: number;
  number: number;
  periodFrom: string;
  periodTo: string;
  freeText: string;
  items: SaveIssueItem[];
}

export async function saveIssue(input: SaveIssueInput) {
  let issueId = input.issueId;
  const meta = {
    number: input.number,
    periodFrom: input.periodFrom,
    periodTo: input.periodTo,
    freeText: input.freeText || null,
  };

  if (issueId) {
    await db.update(issues).set(meta).where(eq(issues.id, issueId));
    await db.delete(issueProducts).where(eq(issueProducts.issueId, issueId));
  } else {
    const [created] = await db.insert(issues).values(meta).returning();
    issueId = created.id;
  }

  if (input.items.length) {
    await db.insert(issueProducts).values(
      input.items.map((it) => ({
        issueId: issueId!,
        productId: it.productId,
        oldPriceEur: it.oldPriceEur != null ? String(it.oldPriceEur) : null,
        newPriceEur: it.newPriceEur != null ? String(it.newPriceEur) : null,
        percentOnly: it.percentOnly,
        percent: it.percent ?? null,
        isHero: it.isHero,
        sortOrder: it.sortOrder,
        priceConfirmed: true, // saving from the composer confirms all prices
      }))
    );
  }

  return { ok: true as const, id: issueId };
}
