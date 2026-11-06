// Object storage: Cloudflare R2 / S3 in production, local disk in development.
// Buckets are private — files are only served through authorised API routes / short-lived URLs.
import { promises as fs } from "fs";
import path from "path";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

let s3: S3Client | null = null;
function client() {
  if (!s3) {
    s3 = new S3Client({
      region: env.s3.region,
      endpoint: env.s3.endpoint || undefined,
      credentials: { accessKeyId: env.s3.accessKeyId, secretAccessKey: env.s3.secretAccessKey },
    });
  }
  return s3;
}

function localPath(key: string) {
  const root = path.resolve(env.localStorageDir);
  const p = path.resolve(root, key);
  if (!p.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return p;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  if (env.storageDriver === "s3") {
    await client().send(
      new PutObjectCommand({
        Bucket: env.s3.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return;
  }
  const p = localPath(key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, body);
}

export async function getObject(key: string): Promise<Buffer> {
  if (env.storageDriver === "s3") {
    const res = await client().send(new GetObjectCommand({ Bucket: env.s3.bucket, Key: key }));
    return Buffer.from(await res.Body!.transformToByteArray());
  }
  return fs.readFile(localPath(key));
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    if (env.storageDriver === "s3") {
      await client().send(
        new GetObjectCommand({ Bucket: env.s3.bucket, Key: key, Range: "bytes=0-0" }),
      );
      return true;
    }
    await fs.access(localPath(key));
    return true;
  } catch {
    return false;
  }
}

export async function deleteObject(key: string) {
  if (env.storageDriver === "s3") {
    await client().send(new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: key }));
    return;
  }
  await fs.rm(localPath(key), { force: true });
}

/** Signed URL valid for 15 minutes (S3) or null for local storage (caller streams instead). */
export async function signedUrl(key: string, downloadName?: string): Promise<string | null> {
  if (env.storageDriver !== "s3") return null;
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: env.s3.bucket,
      Key: key,
      ResponseContentDisposition: downloadName
        ? `attachment; filename="${downloadName}"`
        : undefined,
    }),
    { expiresIn: 15 * 60 },
  );
}
