import SiteSettings from '../models/SiteSettings.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { uploadToCloud, deleteFromCloud } from '../services/cloudStorage.js';

export const getSiteSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  
  res.json({
    success: true,
    data: settings.getPublicSettings(),
  });
});

export const getAdminSiteSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  
  res.json({
    success: true,
    data: settings,
  });
});

export const updateSiteSettings = asyncHandler(async (req, res) => {
  let settings = await SiteSettings.getSettings();
  
  const allowedUpdates = [
    'siteName', 'siteDescription', 'siteUrl',
    'logo', 'logoDark', 'favicon',
    'primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor', 'fontFamily',
    'heroBanner',
    'featuredCategories', 'featuredVideos', 'trendingVideos', 'latestVideos', 'mostViewedVideos',
    'socialLinks',
    'contactEmail', 'supportEmail',
    'copyrightText',
    'privacyPolicyUrl', 'termsOfServiceUrl', 'dmcaUrl', 'cookiePolicyUrl',
    'adsenseClientId', 'adsenseSlots',
    'adSettings',
    'analytics',
    'seo',
    'video',
    'player',
    'comments',
    'maintenance',
    'registration',
    'cache',
  ];
  
  const updates = req.body;
  
  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      settings[field] = updates[field];
    }
  });
  
  if (req.files) {
    if (req.files.logo?.[0]) {
      if (settings.logo) await deleteFromCloud(settings.logo);
      const uploaded = await uploadToCloud(req.files.logo[0].path, 'site/logo');
      settings.logo = uploaded.url;
    }
    
    if (req.files.logoDark?.[0]) {
      if (settings.logoDark) await deleteFromCloud(settings.logoDark);
      const uploaded = await uploadToCloud(req.files.logoDark[0].path, 'site/logo');
      settings.logoDark = uploaded.url;
    }
    
    if (req.files.favicon?.[0]) {
      if (settings.favicon) await deleteFromCloud(settings.favicon);
      const uploaded = await uploadToCloud(req.files.favicon[0].path, 'site/favicon');
      settings.favicon = uploaded.url;
    }
    
    if (req.files.heroBanner?.[0]) {
      if (settings.heroBanner?.backgroundImage) await deleteFromCloud(settings.heroBanner.backgroundImage);
      const uploaded = await uploadToCloud(req.files.heroBanner[0].path, 'site/hero');
      settings.heroBanner.backgroundImage = uploaded.url;
    }
    
    if (req.files.ogImage?.[0]) {
      if (settings.seo?.defaultOgImage) await deleteFromCloud(settings.seo.defaultOgImage);
      const uploaded = await uploadToCloud(req.files.ogImage[0].path, 'site/seo');
      if (!settings.seo) settings.seo = {};
      settings.seo.defaultOgImage = uploaded.url;
    }
  }
  
  settings.updatedBy = req.admin._id;
  await settings.save();
  
  res.json({
    success: true,
    message: 'Site settings updated successfully',
    data: settings.getPublicSettings(),
  });
});

export const updateHeroBanner = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  const { title, subtitle, ctaText, ctaLink, videoId } = req.body;
  
  if (!settings.heroBanner) settings.heroBanner = {};
  
  if (title) settings.heroBanner.title = title;
  if (subtitle) settings.heroBanner.subtitle = subtitle;
  if (ctaText) settings.heroBanner.ctaText = ctaText;
  if (ctaLink) settings.heroBanner.ctaLink = ctaLink;
  if (videoId) settings.heroBanner.videoId = videoId;
  
  if (req.files?.backgroundImage?.[0]) {
    if (settings.heroBanner.backgroundImage) {
      await deleteFromCloud(settings.heroBanner.backgroundImage);
    }
    const uploaded = await uploadToCloud(req.files.backgroundImage[0].path, 'site/hero');
    settings.heroBanner.backgroundImage = uploaded.url;
  }
  
  settings.updatedBy = req.admin._id;
  await settings.save();
  
  res.json({
    success: true,
    message: 'Hero banner updated successfully',
    data: settings.heroBanner,
  });
});

export const updateFeaturedContent = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  const { featuredCategories, featuredVideos, trendingVideos, latestVideos, mostViewedVideos } = req.body;
  
  if (featuredCategories) settings.featuredCategories = featuredCategories;
  if (featuredVideos) settings.featuredVideos = featuredVideos;
  if (trendingVideos) settings.trendingVideos = trendingVideos;
  if (latestVideos) settings.latestVideos = latestVideos;
  if (mostViewedVideos) settings.mostViewedVideos = mostViewedVideos;
  
  settings.updatedBy = req.admin._id;
  await settings.save();
  
  res.json({
    success: true,
    message: 'Featured content updated successfully',
    data: {
      featuredCategories: settings.featuredCategories,
      featuredVideos: settings.featuredVideos,
      trendingVideos: settings.trendingVideos,
      latestVideos: settings.latestVideos,
      mostViewedVideos: settings.mostViewedVideos,
    },
  });
});

export const updateAdSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  const { adsenseClientId, adsenseSlots, adSettings } = req.body;
  
  if (adsenseClientId) settings.adsenseClientId = adsenseClientId;
  if (adsenseSlots) settings.adsenseSlots = { ...settings.adsenseSlots, ...adsenseSlots };
  if (adSettings) settings.adSettings = { ...settings.adSettings, ...adSettings };
  
  settings.updatedBy = req.admin._id;
  await settings.save();
  
  res.json({
    success: true,
    message: 'Ad settings updated successfully',
    data: {
      adsenseClientId: settings.adsenseClientId,
      adsenseSlots: settings.adsenseSlots,
      adSettings: settings.adSettings,
    },
  });
});

export const updateAnalyticsSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  const { googleAnalyticsId, googleTagManagerId, facebookPixelId, customHeadScript, customBodyScript } = req.body;
  
  if (!settings.analytics) settings.analytics = {};
  
  if (googleAnalyticsId) settings.analytics.googleAnalyticsId = googleAnalyticsId;
  if (googleTagManagerId) settings.analytics.googleTagManagerId = googleTagManagerId;
  if (facebookPixelId) settings.analytics.facebookPixelId = facebookPixelId;
  if (customHeadScript) settings.analytics.customHeadScript = customHeadScript;
  if (customBodyScript) settings.analytics.customBodyScript = customBodyScript;
  
  settings.updatedBy = req.admin._id;
  await settings.save();
  
  res.json({
    success: true,
    message: 'Analytics settings updated successfully',
    data: settings.analytics,
  });
});

export const updateSeoSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  const { defaultTitle, defaultDescription, defaultKeywords, defaultOgImage, robotsTxt, sitemapEnabled } = req.body;
  
  if (!settings.seo) settings.seo = {};
  
  if (defaultTitle) settings.seo.defaultTitle = defaultTitle;
  if (defaultDescription) settings.seo.defaultDescription = defaultDescription;
  if (defaultKeywords) settings.seo.defaultKeywords = defaultKeywords;
  if (defaultOgImage) settings.seo.defaultOgImage = defaultOgImage;
  if (robotsTxt) settings.seo.robotsTxt = robotsTxt;
  if (sitemapEnabled !== undefined) settings.seo.sitemapEnabled = sitemapEnabled;
  
  if (req.files?.ogImage?.[0]) {
    if (settings.seo.defaultOgImage) await deleteFromCloud(settings.seo.defaultOgImage);
    const uploaded = await uploadToCloud(req.files.ogImage[0].path, 'site/seo');
    settings.seo.defaultOgImage = uploaded.url;
  }
  
  settings.updatedBy = req.admin._id;
  await settings.save();
  
  res.json({
    success: true,
    message: 'SEO settings updated successfully',
    data: settings.seo,
  });
});

export const updateVideoSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  const videoSettings = req.body;
  
  if (!settings.video) settings.video = {};
  
  Object.keys(videoSettings).forEach(key => {
    if (videoSettings[key] !== undefined) {
      settings.video[key] = videoSettings[key];
    }
  });
  
  settings.updatedBy = req.admin._id;
  await settings.save();
  
  res.json({
    success: true,
    message: 'Video settings updated successfully',
    data: settings.video,
  });
});

export const updatePlayerSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  const playerSettings = req.body;
  
  if (!settings.player) settings.player = {};
  
  Object.keys(playerSettings).forEach(key => {
    if (playerSettings[key] !== undefined) {
      settings.player[key] = playerSettings[key];
    }
  });
  
  settings.updatedBy = req.admin._id;
  await settings.save();
  
  res.json({
    success: true,
    message: 'Player settings updated successfully',
    data: settings.player,
  });
});

export const updateCommentSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  const commentSettings = req.body;
  
  if (!settings.comments) settings.comments = {};
  
  Object.keys(commentSettings).forEach(key => {
    if (commentSettings[key] !== undefined) {
      settings.comments[key] = commentSettings[key];
    }
  });
  
  settings.updatedBy = req.admin._id;
  await settings.save();
  
  res.json({
    success: true,
    message: 'Comment settings updated successfully',
    data: settings.comments,
  });
});

export const updateMaintenanceMode = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  const { enabled, message, allowedIPs } = req.body;
  
  if (!settings.maintenance) settings.maintenance = {};
  
  if (enabled !== undefined) settings.maintenance.enabled = enabled;
  if (message) settings.maintenance.message = message;
  if (allowedIPs) settings.maintenance.allowedIPs = allowedIPs;
  
  settings.updatedBy = req.admin._id;
  await settings.save();
  
  res.json({
    success: true,
    message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
    data: settings.maintenance,
  });
});

export const updateRegistrationSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  const { enabled, requireVerification, defaultRole, allowedDomains, blockedDomains } = req.body;
  
  if (!settings.registration) settings.registration = {};
  
  if (enabled !== undefined) settings.registration.enabled = enabled;
  if (requireVerification !== undefined) settings.registration.requireVerification = requireVerification;
  if (defaultRole) settings.registration.defaultRole = defaultRole;
  if (allowedDomains) settings.registration.allowedDomains = allowedDomains;
  if (blockedDomains) settings.registration.blockedDomains = blockedDomains;
  
  settings.updatedBy = req.admin._id;
  await settings.save();
  
  res.json({
    success: true,
    message: 'Registration settings updated successfully',
    data: settings.registration,
  });
});

export const updateUploadSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  const { storage, localPath, s3Bucket, s3Region, s3AccessKey, s3SecretKey, cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret, cdnUrl } = req.body;
  
  if (!settings.upload) settings.upload = {};
  
  if (storage) settings.upload.storage = storage;
  if (localPath) settings.upload.localPath = localPath;
  if (s3Bucket) settings.upload.s3Bucket = s3Bucket;
  if (s3Region) settings.upload.s3Region = s3Region;
  if (s3AccessKey) settings.upload.s3AccessKey = s3AccessKey;
  if (s3SecretKey) settings.upload.s3SecretKey = s3SecretKey;
  if (cloudinaryCloudName) settings.upload.cloudinaryCloudName = cloudinaryCloudName;
  if (cloudinaryApiKey) settings.upload.cloudinaryApiKey = cloudinaryApiKey;
  if (cloudinaryApiSecret) settings.upload.cloudinaryApiSecret = cloudinaryApiSecret;
  if (cdnUrl) settings.upload.cdnUrl = cdnUrl;
  
  settings.updatedBy = req.admin._id;
  await settings.save();
  
  res.json({
    success: true,
    message: 'Upload settings updated successfully',
    data: settings.upload,
  });
});

export const getPublicConfig = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  
  const publicConfig = {
    siteName: settings.siteName,
    siteDescription: settings.siteDescription,
    siteUrl: settings.siteUrl,
    logo: settings.logo,
    logoDark: settings.logoDark,
    favicon: settings.favicon,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    accentColor: settings.accentColor,
    backgroundColor: settings.backgroundColor,
    textColor: settings.textColor,
    fontFamily: settings.fontFamily,
    heroBanner: settings.heroBanner,
    socialLinks: settings.socialLinks,
    contactEmail: settings.contactEmail,
    supportEmail: settings.supportEmail,
    copyrightText: settings.copyrightText,
    privacyPolicyUrl: settings.privacyPolicyUrl,
    termsOfServiceUrl: settings.termsOfServiceUrl,
    dmcaUrl: settings.dmcaUrl,
    cookiePolicyUrl: settings.cookiePolicyUrl,
    adsenseClientId: settings.adsenseClientId,
    adsenseSlots: settings.adsenseSlots,
    adSettings: settings.adSettings,
    analytics: settings.analytics ? {
      googleAnalyticsId: settings.analytics.googleAnalyticsId,
      googleTagManagerId: settings.analytics.googleTagManagerId,
      facebookPixelId: settings.analytics.facebookPixelId,
    } : {},
    video: settings.video ? {
      defaultQuality: settings.video.defaultQuality,
      autoPlay: settings.video.autoPlay,
      muted: settings.video.muted,
      enablePIP: settings.video.enablePIP,
    } : {},
    player: settings.player ? {
      theme: settings.player.theme,
      accentColor: settings.player.accentColor,
      autoPlay: settings.player.autoPlay,
      muted: settings.player.muted,
      loop: settings.player.loop,
      showControls: settings.player.showControls,
      enablePIP: settings.player.enablePIP,
      enableFullscreen: settings.player.enableFullscreen,
      enableSpeedControl: settings.player.enableSpeedControl,
      enableQualitySelection: settings.player.enableQualitySelection,
      enableChapters: settings.player.enableChapters,
      enableSubtitles: settings.player.enableSubtitles,
    } : {},
    maintenance: settings.maintenance ? {
      enabled: settings.maintenance.enabled,
      message: settings.maintenance.message,
    } : { enabled: false },
  };
  
  res.json({
    success: true,
    data: publicConfig,
  });
});

export const generateSitemap = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  
  if (!settings.seo?.sitemapEnabled) {
    throw new AppError('Sitemap generation is disabled', 403, 'Disabled');
  }
  
  // This would typically be a scheduled job, but we can trigger it manually
  // The actual sitemap generation would be in a separate service
  
  res.json({
    success: true,
    message: 'Sitemap generation triggered',
    data: { status: 'pending' },
  });
});

export const generateRobotsTxt = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  
  let robotsTxt = settings.seo?.robotsTxt || `User-agent: *\nAllow: /\n\nSitemap: ${settings.siteUrl}/sitemap.xml`;
  
  if (settings.maintenance?.enabled) {
    robotsTxt = 'User-agent: *\nDisallow: /';
  }
  
  res.set('Content-Type', 'text/plain');
  res.send(robotsTxt);
});