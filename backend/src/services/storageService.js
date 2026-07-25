import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'anistrem-media';

const REST_THRESHOLD = 50 * 1024 * 1024;

let s3 = null;
if (process.env.SUPABASE_S3_ACCESS_KEY && process.env.SUPABASE_S3_SECRET_KEY) {
  s3 = new S3Client({
    region: 'us-east-1',
    endpoint: `${SUPABASE_URL}/storage/v1/s3`,
    credentials: {
      accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY,
      secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY,
    },
    forcePathStyle: true,
  });
}

export function getPublicUrl(filePath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
}

async function uploadViaRest(localPath, remotePath, contentType) {
  const buffer = await fs.readFile(localPath);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${remotePath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase REST upload failed (${res.status}): ${body}`);
  }
}

async function uploadViaS3(localPath, remotePath, contentType) {
  const stat = await fs.stat(localPath);
  const stream = createReadStream(localPath);

  if (stat.size <= REST_THRESHOLD) {
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
}

export async function uploadToStorage(localPath, remotePath, contentType) {
  if (s3) {
    await uploadViaS3(localPath, remotePath, contentType);
  } else {
    await uploadViaRest(localPath, remotePath, contentType);
  }
  return getPublicUrl(remotePath);
}

export async function deleteFromStorage(remotePath) {
  if (s3) {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: remotePath }));
    } catch (err) {
      console.error('S3 delete failed:', err.message);
    }
  } else {
    try {
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${remotePath}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_KEY}` },
      });
    } catch (err) {
      console.error('REST delete failed:', err.message);
    }
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
