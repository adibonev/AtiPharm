"use server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { uploadToR2 } from "@/lib/r2";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/products");

  const subtitle = String(formData.get("subtitle") || "").trim() || null;
  const type = String(formData.get("type") || "supplement");
  const priceUnit = String(formData.get("priceUnit") || "per_pack");

  let imageUrl: string | null = null;
  const file = formData.get("image") as File | null;
  if (file && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    const ext =
      (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") ||
      "png";
    const key = `products/${crypto.randomUUID()}.${ext}`;
    imageUrl = await uploadToR2(key, buf, file.type || "image/png");
  }

  await db.insert(products).values({
    name,
    subtitle,
    imageUrl,
    type: type as never,
    priceUnit: priceUnit as never,
  });
  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProduct(formData: FormData) {
  const id = Number(formData.get("id"));
  if (id) {
    await db.delete(products).where(eq(products.id, id));
    revalidatePath("/products");
  }
}
