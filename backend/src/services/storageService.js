import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'anistrem-media';

function getPublicUrl(filePath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
}

export async function uploadToStorage(localPath, remotePath, contentType) {
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
    throw new Error(`Supabase upload failed (${res.status}): ${body}`);
  }

  return getPublicUrl(remotePath);
}

export async function deleteFromStorage(remotePath) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${remotePath}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    console.error(`Supabase delete failed (${res.status}): ${body}`);
  }
}

export async function uploadFileAndCleanup(localPath, remotePath, contentType) {
  const url = await uploadToStorage(localPath, remotePath, contentType);
  await fs.unlink(localPath).catch(() => {});
  return url;
}

export function getStorageUrl() {
  return { supabaseUrl: SUPABASE_URL, bucket: BUCKET, publicBase: getPublicUrl('') };
}

export function isRemoteUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}
