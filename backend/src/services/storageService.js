import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'anistrem-media';

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: `${SUPABASE_URL}/storage/v1/s3`,
  credentials: {
    accessKeyId: SUPABASE_KEY,
    secretAccessKey: SUPABASE_KEY,
  },
  forcePathStyle: true,
});

export function getPublicUrl(filePath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
}

export async function uploadToStorage(localPath, remotePath, contentType) {
  const stat = await fs.stat(localPath);
  const stream = createReadStream(localPath);

  if (stat.size <= 50 * 1024 * 1024) {
    const buffer = await fs.readFile(localPath);
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: remotePath,
      Body: buffer,
      ContentType: contentType,
    }));
  } else {
    const parallelUploads = new Upload({
      client: s3,
      params: {
        Bucket: BUCKET,
        Key: remotePath,
        Body: stream,
        ContentType: contentType,
      },
      queueSize: 4,
      partSize: 10 * 1024 * 1024,
      leavePartsOnError: false,
    });
    await parallelUploads.done();
  }

  return getPublicUrl(remotePath);
}

export async function deleteFromStorage(remotePath) {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: remotePath }));
  } catch (err) {
    console.error('Supabase delete failed:', err.message);
  }
}

export async function uploadFileAndCleanup(localPath, remotePath, contentType) {
  const url = await uploadToStorage(localPath, remotePath, contentType);
  await fs.unlink(localPath).catch(() => {});
  return url;
}

export function isRemoteUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}
