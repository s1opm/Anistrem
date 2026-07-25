import express from 'express';
import { authMiddleware, optionalAuth, requireRole } from '../middleware/auth.js';
import { categoryValidators } from '../middleware/validation.js';
import { uploadThumbnail, handleUploadError } from '../middleware/upload.js';
import * as categoryController from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', optionalAuth, categoryValidators.getList, categoryController.getCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/homepage', categoryController.getHomepageCategories);
router.get('/featured', categoryController.getFeaturedCategories);
router.get('/stats', authMiddleware, categoryController.getCategoryStats);
router.get('/search', categoryController.searchCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:id', categoryController.getCategory);

router.post('/', authMiddleware, requireRole('superadmin', 'admin'), uploadThumbnail, handleUploadError, categoryValidators.create, categoryController.createCategory);
router.put('/:id', authMiddleware, requireRole('superadmin', 'admin'), uploadThumbnail, handleUploadError, categoryValidators.update, categoryController.updateCategory);
router.delete('/:id', authMiddleware, requireRole('superadmin', 'admin'), categoryValidators.delete, categoryController.deleteCategory);

router.post('/reorder', authMiddleware, requireRole('superadmin', 'admin'), categoryController.reorderCategories);
router.post('/bulk-update', authMiddleware, requireRole('superadmin', 'admin'), categoryController.bulkUpdateCategories);

export default router;