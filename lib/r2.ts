import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

/** Upload a buffer to R2 and return its public URL. */
export async function uploadToR2(key: string, body: Buffer, contentType: string) {
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${process.env.R2_PUBLIC_BASE_URL}/${key}`;
}

/** Delete an object by key (best-effort). */
export async function deleteFromR2(key: string) {
  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key })
    );
  } catch {
    /* ignore */
  }
}
