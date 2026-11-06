// Object storage for product photos and generated images.
// Production: Azure Blob Storage (private container, short-lived SAS download links).
// Also supported: any S3-compatible store, and local disk for development.
import { promises as fs } from "fs";
import path from "path";
import { BlobSASPermissions, BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

const SIGNED_URL_TTL_MS = 15 * 60 * 1000;

// ---------- Azure Blob Storage ----------
let azure: ContainerClient | null = null;
let azureReady: Promise<unknown> | null = null;
function container(): ContainerClient {
  if (!azure) {
    if (!env.azure.connectionString) throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set");
    azure = BlobServiceClient.fromConnectionString(env.azure.connectionString).getContainerClient(
      env.azure.container,
    );
    // Private container (no anonymous access); created on first use if it doesn't exist.
    azureReady = azure.createIfNotExists();
  }
  return azure;
}
async function blob(key: string) {
  const c = container();
  await azureReady;
  return c.getBlockBlobClient(key);
}

// ---------- S3-compatible ----------
let s3: S3Client | null = null;
function s3Client() {
  if (!s3) {
    s3 = new S3Client({
      region: env.s3.region,
      endpoint: env.s3.endpoint || undefined,
      credentials: { accessKeyId: env.s3.accessKeyId, secretAccessKey: env.s3.secretAccessKey },
    });
  }
  return s3;
}

// ---------- Local disk ----------
function localPath(key: string) {
  const root = path.resolve(env.localStorageDir);
  const p = path.resolve(root, key);
  if (!p.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return p;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  switch (env.storageDriver) {
    case "azure":
      await (await blob(key)).uploadData(body, { blobHTTPHeaders: { blobContentType: contentType } });
      return;
    case "s3":
      await s3Client().send(
        new PutObjectCommand({ Bucket: env.s3.bucket, Key: key, Body: body, ContentType: contentType }),
      );
      return;
    default: {
      const p = localPath(key);
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, body);
    }
  }
}

export async function getObject(key: string): Promise<Buffer> {
  switch (env.storageDriver) {
    case "azure":
      return (await blob(key)).downloadToBuffer();
    case "s3": {
      const res = await s3Client().send(new GetObjectCommand({ Bucket: env.s3.bucket, Key: key }));
      return Buffer.from(await res.Body!.transformToByteArray());
    }
    default:
      return fs.readFile(localPath(key));
  }
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    switch (env.storageDriver) {
      case "azure":
        return (await blob(key)).exists();
      case "s3":
        await s3Client().send(
          new GetObjectCommand({ Bucket: env.s3.bucket, Key: key, Range: "bytes=0-0" }),
        );
        return true;
      default:
        await fs.access(localPath(key));
        return true;
    }
  } catch {
    return false;
  }
}

export async function deleteObject(key: string) {
  switch (env.storageDriver) {
    case "azure":
      await (await blob(key)).deleteIfExists();
      return;
    case "s3":
      await s3Client().send(new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: key }));
      return;
    default:
      await fs.rm(localPath(key), { force: true });
  }
}

/**
 * Read-only link valid for 15 minutes, or null for local storage (the caller streams the file).
 * Azure: SAS URL signed with the account key from the connection string.
 */
export async function signedUrl(key: string, downloadName?: string): Promise<string | null> {
  const disposition = downloadName ? `attachment; filename="${downloadName}"` : undefined;
  switch (env.storageDriver) {
    case "azure":
      return (await blob(key)).generateSasUrl({
        permissions: BlobSASPermissions.parse("r"),
        startsOn: new Date(Date.now() - 60_000),
        expiresOn: new Date(Date.now() + SIGNED_URL_TTL_MS),
        contentDisposition: disposition,
      });
    case "s3":
      return getSignedUrl(
        s3Client(),
        new GetObjectCommand({ Bucket: env.s3.bucket, Key: key, ResponseContentDisposition: disposition }),
        { expiresIn: SIGNED_URL_TTL_MS / 1000 },
      );
    default:
      return null;
  }
}
