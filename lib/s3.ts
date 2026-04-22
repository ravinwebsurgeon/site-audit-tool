import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

export function getPublicUrl(key: string): string {
  const cdnUrl = process.env.AWS_S3_CDN_URL;
  if (cdnUrl) return `${cdnUrl.replace(/\/$/, '')}/${key}`;
  const region = process.env.AWS_REGION ?? 'us-east-1';
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`;
}

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return getPublicUrl(key);
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** Extract S3 key from a full S3/CDN URL. Returns null if not an S3 URL for this bucket. */
export function extractS3Key(url: string): string | null {
  try {
    const parsed = new URL(url);
    const cdnUrl = process.env.AWS_S3_CDN_URL;
    const s3Host = `${BUCKET}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com`;
    if (cdnUrl && url.startsWith(cdnUrl)) {
      return parsed.pathname.slice(1); // strip leading /
    }
    if (parsed.hostname === s3Host) {
      return parsed.pathname.slice(1);
    }
    return null;
  } catch {
    return null;
  }
}
