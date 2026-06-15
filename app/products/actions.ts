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

/** "Намери снимка": Serper.dev Google Images (handles Cyrillic / BG brands).
 *  Key stays server-side. Google's own image-search API was retired in Jan 2026. */
export async function searchImages(query: string): Promise<ImageResult[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key || !query.trim()) return [];
  try {
    const res = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, gl: "bg", hl: "bg", num: 8 }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.images ?? [])
      .map((it: { imageUrl: string; thumbnailUrl?: string }) => ({
        url: it.imageUrl,
        thumb: it.thumbnailUrl ?? it.imageUrl,
      }))
      .filter((r: ImageResult) => r.url)
      .slice(0, 8);
  } catch {
    return [];
  }
}

/** Normalize to a consistent 800×800 white canvas (spec §9). sharp is loaded
 *  lazily so merely importing this module never touches the native binary. */
async function normalize(buf: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  try {
    return await sharp(buf)
      .flatten({ background: "#ffffff" })
      .trim()
      .resize(720, 720, { fit: "inside", withoutEnlargement: true })
      .resize(800, 800, { fit: "contain", background: "#ffffff" })
      .png()
      .toBuffer();
  } catch {
    return await sharp(buf)
      .flatten({ background: "#ffffff" })
      .resize(800, 800, { fit: "contain", background: "#ffffff" })
      .png()
      .toBuffer();
  }
}

/** Get bytes from a manual upload or a chosen image URL, normalize if possible,
 *  and store in R2. Falls back to a raw upload if sharp is unavailable. */
async function resolveImage(file: File | null, externalUrl: string): Promise<string | null> {
  let buf: Buffer | null = null;
  let contentType = "image/png";
  if (file && file.size > 0) {
    buf = Buffer.from(await file.arrayBuffer());
    contentType = file.type || "image/png";
  } else if (externalUrl) {
    try {
      const r = await fetch(externalUrl);
      if (r.ok) {
        buf = Buffer.from(await r.arrayBuffer());
        contentType = r.headers.get("content-type") || "image/jpeg";
      }
    } catch {
      /* ignore */
    }
  }
  if (!buf) return null;

  const id = crypto.randomUUID();
  try {
    const out = await normalize(buf);
    return await uploadToR2(`products/${id}.png`, out, "image/png");
  } catch {
    // sharp not available — upload the original bytes as-is
    const ext =
      (contentType.split("/")[1] || "png").split(";")[0].replace(/[^a-z0-9]/g, "") || "png";
    try {
      return await uploadToR2(`products/${id}.${ext}`, buf, contentType);
    } catch {
      return null;
    }
  }
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
