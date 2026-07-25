import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

const UPLOAD_DIR = config.upload.dir || './uploads';

export const uploadToCloud = async (filePath, folder) => {
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  switch (storageType) {
    case 's3':
      return uploadToS3(filePath, folder);
    case 'cloudinary':
      return uploadToCloudinary(filePath, folder);
    case 'gcs':
      return uploadToGCS(filePath, folder);
    default:
      return uploadToLocal(filePath, folder);
  }
};

export const deleteFromCloud = async (url) => {
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  switch (storageType) {
    case 's3':
      return deleteFromS3(url);
    case 'cloudinary':
      return deleteFromCloudinary(url);
    case 'gcs':
      return deleteFromGCS(url);
    default:
      return deleteFromLocal(url);
  }
};

export const getCloudUrl = (filePath) => {
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  switch (storageType) {
    case 's3':
      return getS3Url(filePath);
    case 'cloudinary':
      return getCloudinaryUrl(filePath);
    case 'gcs':
      return getGCSUrl(filePath);
    default:
      return getLocalUrl(filePath);
  }
};

const uploadToLocal = async (filePath, folder) => {
  const fileName = path.basename(filePath);
  const destDir = path.join(UPLOAD_DIR, folder || 'uploads');
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const destPath = path.join(destDir, fileName);
  
  if (filePath !== destPath) {
    fs.copyFileSync(filePath, destPath);
  }
  
  return {
    url: destPath,
    path: destPath,
    filename: fileName,
    size: fs.statSync(destPath).size,
  };
};

const deleteFromLocal = async (url) => {
  try {
    if (fs.existsSync(url)) {
      fs.unlinkSync(url);
    }
  } catch (error) {
    console.error('Failed to delete local file:', error);
  }
};

const getLocalUrl = (filePath) => {
  return `/uploads/${path.relative(UPLOAD_DIR, filePath).replace(/\\/g, '/')}`;
};

const uploadToS3 = async (filePath, folder) => {
  const AWS = await import('aws-sdk');
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
  
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const key = `${folder || 'uploads'}/${Date.now()}_${fileName}`;
  
  const result = await s3.upload({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: getContentType(filePath),
    ACL: 'public-read',
  }).promise();
  
  return {
    url: result.Location,
    path: result.Location,
    filename: fileName,
    key,
    size: fs.statSync(filePath).size,
  };
};

const deleteFromS3 = async (url) => {
  const AWS = await import('aws-sdk');
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
  
  const key = url.replace(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');
  
  await s3.deleteObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  }).promise();
};

const getS3Url = (key) => {
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

const uploadToCloudinary = async (filePath, folder) => {
  const cloudinary = await import('cloudinary');
  
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  const result = await cloudinary.v2.uploader.upload(filePath, {
    folder: folder || 'uploads',
    resource_type: 'auto',
    format: path.extname(filePath).slice(1) || undefined,
  });
  
  return {
    url: result.secure_url,
    path: result.public_id,
    filename: path.basename(filePath),
    publicId: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height,
    size: result.bytes,
    duration: result.duration,
  };
};

const deleteFromCloudinary = async (url) => {
  const cloudinary = await import('cloudinary');
  
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  const publicId = url.split('/').pop().split('.')[0];
  await cloudinary.v2.uploader.destroy(publicId);
};

const getCloudinaryUrl = (publicId) => {
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/${publicId}`;
};

const uploadToGCS = async (filePath, folder) => {
  const { Storage } = await import('@google-cloud/storage');
  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    keyFilename: process.env.GCS_KEY_FILENAME,
  });
  
  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
  const fileName = path.basename(filePath);
  const destPath = `${folder || 'uploads'}/${Date.now()}_${fileName}`;
  
  await bucket.upload(filePath, { destination: destPath });
  
  await bucket.file(destPath).makePublic();
  
  const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${destPath}`;
  
  return {
    url: publicUrl,
    path: destPath,
    filename: fileName,
    size: fs.statSync(filePath).size,
  };
};

const deleteFromGCS = async (url) => {
  const { Storage } = await import('@google-cloud/storage');
  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    keyFilename: process.env.GCS_KEY_FILENAME,
  });
  
  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
  const filePath = url.replace(`https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/`, '');
  await bucket.file(filePath).delete();
};

const getGCSUrl = (filePath) => {
  return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${filePath}`;
};

const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.mkv': 'video/x-matroska',
    '.m3u8': 'application/x-mpegURL',
    '.ts': 'video/mp2t',
    '.mpd': 'application/dash+xml',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.vtt': 'text/vtt',
    '.srt': 'application/x-subrip',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.xml': 'application/xml',
  };
  return contentTypes[ext] || 'application/octet-stream';
};

export const getVideoStreamUrl = (videoId, quality, format = 'hls') => {
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  switch (storageType) {
    case 's3':
      return `${getS3Url(`videos/${videoId}/${format}`)}/${quality}/index.m3u8`;
    case 'cloudinary':
      return getCloudinaryUrl(`videos/${videoId}/${format}/${quality}/index.m3u8`);
    case 'gcs':
      return getGCSUrl(`videos/${videoId}/${format}/${quality}/index.m3u8`);
    default:
      return `/uploads/processed/${videoId}/${format}/${quality}/index.m3u8`;
  }
};