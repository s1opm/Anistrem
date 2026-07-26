import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';

const router = Router();

const SUPABASE_URL = config.storage.supabase.url;
const SUPABASE_KEY = config.storage.supabase.serviceRoleKey;
const BUCKET = config.storage.supabase.bucket || 'anistrem-media';

function getPublicUrl(filePath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
}

router.post('/presign', authMiddleware, asyncHandler(async (req, res) => {
  const { filename, contentType, type = 'video' } = req.body;

  if (!filename) throw new AppError('filename is required', 400);
  if (!contentType) throw new AppError('contentType is required', 400);

  const ext = filename.split('.').pop() || (type === 'video' ? 'mp4' : 'png');
  const folder = type === 'video' ? 'videos' : 'thumbnails';
  const remotePath = `${folder}/${uuidv4()}.${ext}`;

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${remotePath}`;
  const publicUrl = getPublicUrl(remotePath);

  res.json({
    success: true,
    data: {
      uploadUrl,
      publicUrl,
      remotePath,
      bucket: BUCKET,
      supabaseUrl: SUPABASE_URL,
      token: SUPABASE_KEY,
    },
  });
}));

export default router;
