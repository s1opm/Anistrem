import { Router } from 'express';
import * as siteSettingsController from '../controllers/siteSettingsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', siteSettingsController.getSiteSettings);
router.get('/admin', authMiddleware, siteSettingsController.getAdminSiteSettings);
router.get('/public-config', siteSettingsController.getPublicConfig);
router.get('/sitemap.xml', siteSettingsController.generateSitemap);
router.get('/robots.txt', siteSettingsController.generateRobotsTxt);

router.put('/', authMiddleware, siteSettingsController.updateSiteSettings);
router.put('/hero-banner', authMiddleware, siteSettingsController.updateHeroBanner);
router.put('/featured-content', authMiddleware, siteSettingsController.updateFeaturedContent);
router.put('/ads', authMiddleware, siteSettingsController.updateAdSettings);
router.put('/analytics', authMiddleware, siteSettingsController.updateAnalyticsSettings);
router.put('/seo', authMiddleware, siteSettingsController.updateSeoSettings);
router.put('/video', authMiddleware, siteSettingsController.updateVideoSettings);
router.put('/player', authMiddleware, siteSettingsController.updatePlayerSettings);
router.put('/comments', authMiddleware, siteSettingsController.updateCommentSettings);
router.put('/maintenance', authMiddleware, siteSettingsController.updateMaintenanceMode);
router.put('/registration', authMiddleware, siteSettingsController.updateRegistrationSettings);
router.put('/upload', authMiddleware, siteSettingsController.updateUploadSettings);

export default router;
