import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/', authMiddleware, dashboardController.getDashboardStats);
router.get('/video-analytics', authMiddleware, dashboardController.getVideoAnalytics);
router.get('/category-analytics', authMiddleware, dashboardController.getCategoryAnalytics);
router.get('/revenue', authMiddleware, dashboardController.getRevenueAnalytics);
router.get('/system-health', authMiddleware, requireRole('superadmin', 'admin'), dashboardController.getSystemHealth);
router.get('/recent-activity', authMiddleware, dashboardController.getRecentActivity);
router.get('/export', authMiddleware, requireRole('superadmin', 'admin'), dashboardController.exportData);

export default router;