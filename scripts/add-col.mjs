import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const sql = neon(process.env.DATABASE_URL);
await sql`ALTER TABLE issue_products ADD COLUMN IF NOT EXISTS low_price boolean NOT NULL DEFAULT false`;
const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='issue_products' AND column_name='low_price'`;
console.log("low_price exists:", r.length > 0);
