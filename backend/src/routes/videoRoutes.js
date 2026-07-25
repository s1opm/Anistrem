import express from 'express';
import { authMiddleware, optionalAuth, requireRole } from '../middleware/auth.js';
import { videoValidators } from '../middleware/validation.js';
import { uploadVideo, uploadThumbnail, uploadMultiple, handleUploadError } from '../middleware/upload.js';
import * as videoController from '../controllers/videoController.js';

const router = express.Router();

router.get('/process/:jobId/status', authMiddleware, videoController.getProcessStatus);
router.get('/', optionalAuth, videoValidators.getList, videoController.getVideos);
router.get('/trending', videoController.getTrending);
router.get('/featured', videoController.getFeatured);
router.get('/search', videoController.searchVideos);
router.get('/stats', authMiddleware, videoController.getStats);
router.get('/:id', optionalAuth, videoController.getVideo);
router.get('/:id/related', videoController.getRelated);

router.post('/', authMiddleware, requireRole('superadmin', 'admin', 'editor'), uploadMultiple, handleUploadError, videoValidators.upload, videoController.createVideo);
router.put('/:id', authMiddleware, requireRole('superadmin', 'admin', 'editor'), uploadMultiple, handleUploadError, videoValidators.update, videoController.updateVideo);
router.delete('/:id', authMiddleware, requireRole('superadmin', 'admin'), videoValidators.delete, videoController.deleteVideo);

router.patch('/:id/publish', authMiddleware, requireRole('superadmin', 'admin', 'editor'), videoController.publishVideo);
router.patch('/:id/unpublish', authMiddleware, requireRole('superadmin', 'admin', 'editor'), videoController.unpublishVideo);
router.patch('/:id/feature', authMiddleware, requireRole('superadmin', 'admin'), videoController.featureVideo);

export default router;