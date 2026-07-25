import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authMiddleware } from '../middleware/auth.js';
import { categoryValidators } from '../middleware/validation.js';

const router = Router();

router.get('/tree', categoryController.getCategoryTree);
router.get('/homepage', categoryController.getHomepageCategories);
router.get('/featured', categoryController.getFeaturedCategories);
router.get('/search', categoryController.searchCategories);
router.get('/stats/:id', categoryController.getCategoryStats);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/', categoryValidators.getList, categoryController.getCategories);
router.get('/:id', categoryController.getCategory);

router.post('/', authMiddleware, categoryValidators.create, categoryController.createCategory);
router.post('/reorder', authMiddleware, categoryController.reorderCategories);
router.post('/bulk-update', authMiddleware, categoryController.bulkUpdateCategories);
router.put('/:id', authMiddleware, categoryValidators.update, categoryController.updateCategory);
router.delete('/:id', authMiddleware, categoryValidators.delete, categoryController.deleteCategory);

export default router;
