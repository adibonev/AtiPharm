"use server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { uploadToR2 } from "@/lib/r2";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface ImageResult {
  url: string;
  thumb: string;
}

/** "Намери снимка": Google Programmable Search (image). Key stays server-side. */
export async function searchImages(query: string): Promise<ImageResult[]> {
  const key = process.env.IMAGE_SEARCH_API_KEY;
  const cx = process.env.IMAGE_SEARCH_CX;
  if (!key || !cx || !query.trim()) return [];
  const u =
    `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}` +
    `&searchType=image&num=6&safe=active&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(u);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? [])
      .map((it: { link: string; image?: { thumbnailLink?: string } }) => ({
        url: it.link,
        thumb: it.image?.thumbnailLink ?? it.link,
      }))
      .slice(0, 6);
  } catch {
    return [];
  }
}

/** Upload a manual file, or fetch a chosen image URL and store it in R2. */
async function resolveImage(file: File | null, externalUrl: string): Promise<string | null> {
  if (file && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    const ext =
      (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    return uploadToR2(`products/${crypto.randomUUID()}.${ext}`, buf, file.type || "image/png");
  }
  if (externalUrl) {
    try {
      const r = await fetch(externalUrl);
      if (!r.ok) return null;
      const buf = Buffer.from(await r.arrayBuffer());
      const ct = r.headers.get("content-type") || "image/jpeg";
      const ext = (ct.split("/")[1] || "jpg").split(";")[0].replace(/[^a-z0-9]/g, "") || "jpg";
      return uploadToR2(`products/${crypto.randomUUID()}.${ext}`, buf, ct);
    } catch {
      return null;
    }
  }
  return null;
}

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/products");

  const subtitle = String(formData.get("subtitle") || "").trim() || null;
  const type = String(formData.get("type") || "supplement");
  const priceUnit = String(formData.get("priceUnit") || "per_pack");
  const file = formData.get("image") as File | null;
  const externalUrl = String(formData.get("imageUrlExternal") || "").trim();

  const imageUrl = await resolveImage(file, externalUrl);

  await db.insert(products).values({
    name,
    subtitle,
    imageUrl,
    type: type as never,
    priceUnit: priceUnit as never,
  });
  revalidatePath("/products");
  revalidatePath("/composer");
  redirect("/products");
}

export async function deleteProduct(formData: FormData) {
  const id = Number(formData.get("id"));
  if (id) {
    await db.delete(products).where(eq(products.id, id));
    revalidatePath("/products");
    revalidatePath("/composer");
  }
}
