"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateSettings(formData: FormData) {
  const str = (k: string) => {
    const v = String(formData.get(k) || "").trim();
    return v || null;
  };
  const data = {
    slogan: str("slogan"),
    address: str("address"),
    phone: str("phone"),
    facebook: str("facebook"),
    workingHours: str("workingHours"),
    disclaimerOtc: str("disclaimerOtc"),
    disclaimerSupplement: str("disclaimerSupplement"),
  };

  const existing = await db.select().from(settings);
  if (existing.length) {
    await db.update(settings).set(data).where(eq(settings.id, existing[0].id));
  } else {
    await db.insert(settings).values(data);
  }
  revalidatePath("/settings");
  revalidatePath("/composer");
  redirect("/settings?saved=1");
}
