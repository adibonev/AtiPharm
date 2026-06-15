// One-off R2 connectivity check: uploads a tiny object and prints its public URL.
// Run: NODE_OPTIONS=--use-system-ca node scripts/r2-test.mjs
import { readFileSync } from "node:fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const key = "products/_r2test.txt";
await client.send(
  new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: "ok",
    ContentType: "text/plain",
  })
);
console.log("UPLOAD_OK " + `${process.env.R2_PUBLIC_BASE_URL}/${key}`);
