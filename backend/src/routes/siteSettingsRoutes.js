import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import * as siteSettingsController from '../controllers/siteSettingsController.js';

const router = express.Router();

router.get('/', siteSettingsController.getSiteSettings);
router.get('/admin', authMiddleware, siteSettingsController.getAdminSiteSettings);
router.get('/public-config', siteSettingsController.getPublicConfig);

router.put('/', authMiddleware, requireRole('superadmin', 'admin'), siteSettingsController.updateSiteSettings);
router.put('/hero-banner', authMiddleware, requireRole('superadmin', 'admin'), siteSettingsController.updateHeroBanner);
router.put('/featured-content', authMiddleware, requireRole('superadmin', 'admin'), siteSettingsController.updateFeaturedContent);
router.put('/ads', authMiddleware, requireRole('superadmin', 'admin'), siteSettingsController.updateAdSettings);
router.put('/analytics', authMiddleware, requireRole('superadmin', 'admin'), siteSettingsController.updateAnalyticsSettings);
router.put('/seo', authMiddleware, requireRole('superadmin', 'admin'), siteSettingsController.updateSeoSettings);
router.put('/video', authMiddleware, requireRole('superadmin', 'admin'), siteSettingsController.updateVideoSettings);
router.put('/player', authMiddleware, requireRole('superadmin', 'admin'), siteSettingsController.updatePlayerSettings);
router.put('/comments', authMiddleware, requireRole('superadmin', 'admin'), siteSettingsController.updateCommentSettings);
router.put('/maintenance', authMiddleware, requireRole('superadmin', 'admin'), siteSettingsController.updateMaintenanceMode);
router.put('/registration', authMiddleware, requireRole('superadmin', 'admin'), siteSettingsController.updateRegistrationSettings);
router.put('/upload', authMiddleware, requireRole('superadmin', 'admin'), siteSettingsController.updateUploadSettings);

router.get('/sitemap.xml', siteSettingsController.generateSitemap);
router.get('/robots.txt', siteSettingsController.generateRobotsTxt);

export default router;