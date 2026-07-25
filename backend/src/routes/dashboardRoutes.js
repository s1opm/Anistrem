import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, dashboardController.getDashboardStats);
router.get('/video-analytics', authMiddleware, dashboardController.getVideoAnalytics);
router.get('/category-analytics', authMiddleware, dashboardController.getCategoryAnalytics);
router.get('/revenue', authMiddleware, dashboardController.getRevenueAnalytics);
router.get('/system-health', authMiddleware, dashboardController.getSystemHealth);
router.get('/recent-activity', authMiddleware, dashboardController.getRecentActivity);
router.get('/export', authMiddleware, dashboardController.exportData);

export default router;
