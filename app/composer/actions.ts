"use server";

import { db } from "@/db";
import { issues, issueProducts } from "@/db/schema";

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
  number: number;
  periodFrom: string;
  periodTo: string;
  freeText: string;
  items: SaveIssueItem[];
}

export async function saveIssue(input: SaveIssueInput) {
  const [issue] = await db
    .insert(issues)
    .values({
      number: input.number,
      periodFrom: input.periodFrom,
      periodTo: input.periodTo,
      freeText: input.freeText || null,
    })
    .returning();

  if (input.items.length) {
    await db.insert(issueProducts).values(
      input.items.map((it) => ({
        issueId: issue.id,
        productId: it.productId,
        oldPriceEur: it.oldPriceEur != null ? String(it.oldPriceEur) : null,
        newPriceEur: it.newPriceEur != null ? String(it.newPriceEur) : null,
        percentOnly: it.percentOnly,
        percent: it.percent ?? null,
        isHero: it.isHero,
        sortOrder: it.sortOrder,
        priceConfirmed: true,
      }))
    );
  }

  return { ok: true, id: issue.id };
}
