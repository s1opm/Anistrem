import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/index.js';

const tempDir = path.join(config.upload.dir, 'temp');
const videosDir = path.join(config.upload.dir, 'videos');
const thumbnailsDir = path.join(config.upload.dir, 'thumbnails');

async function ensureDirs() {
  await fs.mkdir(tempDir, { recursive: true });
  await fs.mkdir(videosDir, { recursive: true });
  await fs.mkdir(thumbnailsDir, { recursive: true });
}

await ensureDirs();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

function videoFilter(_req, file, cb) {
  if (config.upload.allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid video type: ${file.mimetype}. Allowed: ${config.upload.allowedVideoTypes.join(', ')}`));
  }
}

function imageFilter(_req, file, cb) {
  if (config.upload.allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid image type: ${file.mimetype}. Allowed: ${config.upload.allowedImageTypes.join(', ')}`));
  }
}

function mixedFilter(_req, file, cb) {
  const allAllowed = [...config.upload.allowedVideoTypes, ...config.upload.allowedImageTypes];
  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allAllowed.join(', ')}`));
  }
}

export const uploadVideo = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, videosDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter: videoFilter,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 },
}).single('video');

export const uploadThumbnail = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, thumbnailsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('thumbnail');

export const uploadMultiple = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      if (file.fieldname === 'video') cb(null, videosDir);
      else if (file.fieldname === 'thumbnail') cb(null, thumbnailsDir);
      else cb(null, tempDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: mixedFilter,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 },
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]);

export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'File too large',
      LIMIT_FILE_COUNT: 'Too many files',
      LIMIT_UNEXPECTED_FILE: 'Unexpected field name',
      LIMIT_PART_COUNT: 'Too many parts',
      LIMIT_FIELD_KEY: 'Field name too long',
      LIMIT_FIELD_VALUE: 'Field value too long',
      LIMIT_FIELD_COUNT: 'Too many fields',
    };
    return res.status(400).json({
      error: messages[err.code] || 'Upload error',
      details: err.message,
    });
  }

  if (err && err.message?.startsWith('Invalid')) {
    return res.status(400).json({ error: err.message });
  }

  if (err) {
    return res.status(500).json({ error: 'Internal server error during upload' });
  }

  next();
}

export async function cleanupTempFiles(files) {
  const paths = [];

  if (files) {
    if (files.video) paths.push(...files.video.map((f) => f.path));
    if (files.thumbnail) paths.push(...files.thumbnail.map((f) => f.path));
    if (files.images) paths.push(...files.images.map((f) => f.path));
    if (files.path) paths.push(files.path);
    if (Array.isArray(files)) paths.push(...files.map((f) => f.path));
  }

  await Promise.allSettled(
    paths.map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch {
        // file already gone or never existed
      }
    })
  );
}
