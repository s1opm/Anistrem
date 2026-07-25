import { Router } from 'express';
import * as videoController from '../controllers/videoController.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { videoValidators, validate } from '../middleware/validation.js';
import { uploadVideo, uploadThumbnail, handleUploadError } from '../middleware/upload.js';

const router = Router();

router.get('/trending', videoController.getTrending);
router.get('/featured', videoController.getFeatured);
router.get('/search', videoController.searchVideos);
router.get('/', validate(videoValidators.getList), videoController.getVideos);
router.get('/stats/:id', validate(videoValidators.getById), videoController.getStats);
router.get('/:id/related', validate(videoValidators.getById), videoController.getRelated);
router.get('/:id', validate(videoValidators.getById), videoController.getVideo);
router.get('/slug/:slug', videoController.getVideoBySlug);

router.post('/', authMiddleware, validate(videoValidators.create), videoController.createVideo);
router.put('/:id', authMiddleware, validate(videoValidators.update), videoController.updateVideo);
router.delete('/:id', authMiddleware, validate(videoValidators.delete), videoController.deleteVideo);
router.patch('/:id/publish', authMiddleware, videoController.publishVideo);
router.patch('/:id/unpublish', authMiddleware, videoController.unpublishVideo);
router.patch('/:id/feature', authMiddleware, videoController.featureVideo);

export default router;
