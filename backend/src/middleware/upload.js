import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';
import { AppError } from './errorHandler.js';

const uploadDir = config.upload.dir;

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(path.join(uploadDir, 'videos'))) {
  fs.mkdirSync(path.join(uploadDir, 'videos'), { recursive: true });
}

if (!fs.existsSync(path.join(uploadDir, 'thumbnails'))) {
  fs.mkdirSync(path.join(uploadDir, 'thumbnails'), { recursive: true });
}

if (!fs.existsSync(path.join(uploadDir, 'temp'))) {
  fs.mkdirSync(path.join(uploadDir, 'temp'), { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = path.join(uploadDir, 'temp');
    
    if (file.fieldname === 'video') {
      dest = path.join(uploadDir, 'videos');
    } else if (file.fieldname === 'thumbnail' || file.fieldname === 'preview') {
      dest = path.join(uploadDir, 'thumbnails');
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const videoFilter = (req, file, cb) => {
  const allowedTypes = config.upload.allowedVideoTypes;
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid video format. Allowed: ${allowedTypes.join(', ')}`, 400), false);
  }
};

const imageFilter = (req, file, cb) => {
  const allowedTypes = config.upload.allowedImageTypes;
  const normalizedMime = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
  if (allowedTypes.includes(normalizedMime)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid image format: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`, 400), false);
  }
};

export const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1,
  },
}).single('video');

export const uploadThumbnail = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
}).single('thumbnail');

export const uploadMultiple = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      videoFilter(req, file, cb);
    } else if (file.fieldname === 'thumbnail' || file.fieldname === 'preview') {
      imageFilter(req, file, cb);
    } else {
      cb(new AppError(`Unexpected field: ${file.fieldname}`, 400), false);
    }
  },
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 5,
  },
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'preview', maxCount: 1 },
  { name: 'subtitles', maxCount: 10 },
]);

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File Too Large',
        message: `File size exceeds ${config.upload.maxFileSize / (1024 * 1024)}MB limit`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too Many Files',
        message: 'Maximum file upload limit exceeded',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected Field',
        message: `Unexpected field: ${err.field}`,
      });
    }
  }
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.error,
      message: err.message,
    });
  }
  
  next(err);
};

export const cleanupTempFiles = (files) => {
  if (!files) return;
  
  const fileList = Array.isArray(files) ? files : Object.values(files).flat();
  
  fileList.forEach(file => {
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error('Failed to delete temp file:', error);
      }
    }
  });
};