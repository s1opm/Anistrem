import { Router } from 'express';
import * as videoController from '../controllers/videoController.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { videoValidators } from '../middleware/validation.js';
import { uploadMultiple, handleUploadError } from '../middleware/upload.js';

const router = Router();

router.get('/trending', videoController.getTrending);
router.get('/featured', videoController.getFeatured);
router.get('/search', videoController.searchVideos);
router.get('/', videoValidators.getList, videoController.getVideos);
router.get('/stats/:id', videoValidators.getById, videoController.getStats);
router.get('/:id/related', videoValidators.getById, videoController.getRelated);
router.get('/:id', videoValidators.getById, videoController.getVideo);
router.get('/slug/:slug', videoController.getVideoBySlug);

router.post('/', authMiddleware, (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    return uploadMultiple(req, res, (err) => {
      if (err) return handleUploadError(err, req, res, next);
      next();
    });
  }
  next();
}, videoController.createVideo);
router.put('/:id', authMiddleware, videoValidators.update, videoController.updateVideo);
router.delete('/:id', authMiddleware, videoValidators.delete, videoController.deleteVideo);
router.patch('/:id/publish', authMiddleware, videoController.publishVideo);
router.patch('/:id/unpublish', authMiddleware, videoController.unpublishVideo);
router.patch('/:id/feature', authMiddleware, videoController.featureVideo);

export default router;
