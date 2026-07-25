import dotenv from 'dotenv';
dotenv.config();

const requiredInProduction = (key) => {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
};

if (process.env.NODE_ENV === 'production') {
  requiredInProduction('JWT_SECRET');
  requiredInProduction('JWT_REFRESH_SECRET');
  requiredInProduction('MONGODB_URI');
  requiredInProduction('FRONTEND_URL');
}

export const config = {
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/anistrem',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-only-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'AniStrem <noreply@anistrem.com>',
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 524288000,
    allowedVideoTypes: (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/webm,video/ogg,video/quicktime').split(','),
    allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(','),
  },
  
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
  },
  
  ffmpeg: {
    path: process.env.FFMPEG_PATH || 'ffmpeg',
    probePath: process.env.FFPROBE_PATH || 'ffprobe',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  socket: {
    corsOrigin: process.env.SOCKET_IO_CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
};