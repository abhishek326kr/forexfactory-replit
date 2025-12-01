import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

let r2Client: S3Client | null = null;

function assertR2Config() {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "Cloudflare R2 is not configured. Please set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME."
    );
  }
}

function getR2Client(): S3Client {
  assertR2Config();

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
      forcePathStyle: true,
    });
  }

  return r2Client;
}

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName);
}

export async function getR2PresignedUploadUrl({
  prefix = "blog-dashboard/uploads",
  expiresInSeconds = 900,
}: {
  prefix?: string;
  expiresInSeconds?: number;
} = {}) {
  const client = getR2Client();
  const key = `${prefix.replace(/\/$/, "")}/${Date.now()}-${randomUUID()}`;

  const command = new PutObjectCommand({
    Bucket: bucketName!,
    Key: key,
  });

  const uploadURL = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    uploadURL,
    objectKey: key,
  };
}

export function getPublicPathForKey(key: string): string {
  return key.startsWith("/") ? key : `/${key}`;
}

export function extractKeyFromR2Url(uploadURL: string): string | null {
  try {
    const parsed = new URL(uploadURL);
    const path = parsed.pathname.replace(/^\//, "");
    const segments = path.split("/");

    const bucketSegment = segments.shift();
    if (!bucketSegment || bucketSegment !== bucketName) {
      return null;
    }

    return segments.join("/");
  } catch (error) {
    console.error("Failed to parse R2 upload URL", error);
    return null;
  }
}

export async function getR2Object(key: string) {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: bucketName!,
    Key: key,
  });

  return client.send(command);
}
