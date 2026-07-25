import prisma from '../db/index.js';

const PUBLIC_KEYS = [
  'siteName',
  'logo',
  'favicon',
  'theme',
  'colors',
  'heroBanner',
  'featuredContent',
  'footerText',
  'socialLinks',
  'maintenance',
];

async function getSettingsByKey(key) {
  const record = await prisma.siteSettings.findUnique({ where: { key } });
  if (!record) return null;
  try {
    return JSON.parse(record.value);
  } catch {
    return record.value;
  }
}

async function upsertSetting(key, value, adminId) {
  const stringified = typeof value === 'string' ? value : JSON.stringify(value);
  return prisma.siteSettings.upsert({
    where: { key },
    update: { value: stringified, updatedAt: new Date() },
    create: { key, value: stringified, ...(adminId ? { adminId } : {}) },
  });
}

export async function getSiteSettings(req, res) {
  try {
    const records = await prisma.siteSettings.findMany();
    const settings = {};
    for (const record of records) {
      try {
        settings[record.key] = JSON.parse(record.value);
      } catch {
        settings[record.key] = record.value;
      }
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('getSiteSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch site settings',
    });
  }
}

export async function getAdminSiteSettings(req, res) {
  try {
    const records = await prisma.siteSettings.findMany();
    const settings = {};
    for (const record of records) {
      try {
        settings[record.key] = JSON.parse(record.value);
      } catch {
        settings[record.key] = record.value;
      }
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('getAdminSiteSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin site settings',
    });
  }
}

export async function updateSiteSettings(req, res) {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings data',
      });
    }

    const adminId = req.admin?.id || null;
    const results = [];

    for (const [key, value] of Object.entries(settings)) {
      const record = await upsertSetting(key, value, adminId);
      results.push(record);
    }

    return res.status(200).json({
      success: true,
      data: { updated: results.length },
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('updateSiteSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update site settings',
    });
  }
}

export async function updateHeroBanner(req, res) {
  try {
    const { title, subtitle, backgroundImage, ctaText, ctaLink, enabled } = req.body;
    const adminId = req.admin?.id || null;

    const data = {
      ...(title !== undefined && { title }),
      ...(subtitle !== undefined && { subtitle }),
      ...(backgroundImage !== undefined && { backgroundImage }),
      ...(ctaText !== undefined && { ctaText }),
      ...(ctaLink !== undefined && { ctaLink }),
      ...(enabled !== undefined && { enabled }),
    };

    const record = await upsertSetting('heroBanner', data, adminId);

    return res.status(200).json({
      success: true,
      data,
      message: 'Hero banner updated successfully',
    });
  } catch (error) {
    console.error('updateHeroBanner error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update hero banner',
    });
  }
}

export async function updateFeaturedContent(req, res) {
  try {
    const { featuredCategories, featuredVideos, collections, layout } = req.body;
    const adminId = req.admin?.id || null;

    const data = {
      ...(featuredCategories !== undefined && { featuredCategories }),
      ...(featuredVideos !== undefined && { featuredVideos }),
      ...(collections !== undefined && { collections }),
      ...(layout !== undefined && { layout }),
    };

    await upsertSetting('featuredContent', data, adminId);

    return res.status(200).json({
      success: true,
      data,
      message: 'Featured content updated successfully',
    });
  } catch (error) {
    console.error('updateFeaturedContent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update featured content',
    });
  }
}

export async function updateAdSettings(req, res) {
  try {
    const { enabled, provider, placements, refreshInterval, adUnits } = req.body;
    const adminId = req.admin?.id || null;

    const data = {
      ...(enabled !== undefined && { enabled }),
      ...(provider !== undefined && { provider }),
      ...(placements !== undefined && { placements }),
      ...(refreshInterval !== undefined && { refreshInterval }),
      ...(adUnits !== undefined && { adUnits }),
    };

    await upsertSetting('adSettings', data, adminId);

    return res.status(200).json({
      success: true,
      data,
      message: 'Ad settings updated successfully',
    });
  } catch (error) {
    console.error('updateAdSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ad settings',
    });
  }
}

export async function updateAnalyticsSettings(req, res) {
  try {
    const { enabled, provider, trackingId, events } = req.body;
    const adminId = req.admin?.id || null;

    const data = {
      ...(enabled !== undefined && { enabled }),
      ...(provider !== undefined && { provider }),
      ...(trackingId !== undefined && { trackingId }),
      ...(events !== undefined && { events }),
    };

    await upsertSetting('analytics', data, adminId);

    return res.status(200).json({
      success: true,
      data,
      message: 'Analytics settings updated successfully',
    });
  } catch (error) {
    console.error('updateAnalyticsSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update analytics settings',
    });
  }
}

export async function updateSeoSettings(req, res) {
  try {
    const { metaTitle, metaDescription, keywords, ogImage, canonicalUrl, sitemapEnabled } = req.body;
    const adminId = req.admin?.id || null;

    const data = {
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDescription !== undefined && { metaDescription }),
      ...(keywords !== undefined && { keywords }),
      ...(ogImage !== undefined && { ogImage }),
      ...(canonicalUrl !== undefined && { canonicalUrl }),
      ...(sitemapEnabled !== undefined && { sitemapEnabled }),
    };

    await upsertSetting('seo', data, adminId);

    return res.status(200).json({
      success: true,
      data,
      message: 'SEO settings updated successfully',
    });
  } catch (error) {
    console.error('updateSeoSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update SEO settings',
    });
  }
}

export async function updateVideoSettings(req, res) {
  try {
    const {
      defaultQuality,
      autoplay,
      allowDownload,
      maxUploadSize,
      allowedFormats,
      thumbnailGeneration,
      watermarkEnabled,
    } = req.body;
    const adminId = req.admin?.id || null;

    const data = {
      ...(defaultQuality !== undefined && { defaultQuality }),
      ...(autoplay !== undefined && { autoplay }),
      ...(allowDownload !== undefined && { allowDownload }),
      ...(maxUploadSize !== undefined && { maxUploadSize }),
      ...(allowedFormats !== undefined && { allowedFormats }),
      ...(thumbnailGeneration !== undefined && { thumbnailGeneration }),
      ...(watermarkEnabled !== undefined && { watermarkEnabled }),
    };

    await upsertSetting('videoSettings', data, adminId);

    return res.status(200).json({
      success: true,
      data,
      message: 'Video settings updated successfully',
    });
  } catch (error) {
    console.error('updateVideoSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update video settings',
    });
  }
}

export async function updatePlayerSettings(req, res) {
  try {
    const {
      theme,
      volume,
      playbackSpeed,
      subtitleEnabled,
      defaultSubtitleLanguage,
      controlsPosition,
      progressBar,
    } = req.body;
    const adminId = req.admin?.id || null;

    const data = {
      ...(theme !== undefined && { theme }),
      ...(volume !== undefined && { volume }),
      ...(playbackSpeed !== undefined && { playbackSpeed }),
      ...(subtitleEnabled !== undefined && { subtitleEnabled }),
      ...(defaultSubtitleLanguage !== undefined && { defaultSubtitleLanguage }),
      ...(controlsPosition !== undefined && { controlsPosition }),
      ...(progressBar !== undefined && { progressBar }),
    };

    await upsertSetting('playerSettings', data, adminId);

    return res.status(200).json({
      success: true,
      data,
      message: 'Player settings updated successfully',
    });
  } catch (error) {
    console.error('updatePlayerSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update player settings',
    });
  }
}

export async function updateCommentSettings(req, res) {
  try {
    const { enabled, moderationRequired, maxCommentLength, allowReplies, profanityFilter } = req.body;
    const adminId = req.admin?.id || null;

    const data = {
      ...(enabled !== undefined && { enabled }),
      ...(moderationRequired !== undefined && { moderationRequired }),
      ...(maxCommentLength !== undefined && { maxCommentLength }),
      ...(allowReplies !== undefined && { allowReplies }),
      ...(profanityFilter !== undefined && { profanityFilter }),
    };

    await upsertSetting('commentSettings', data, adminId);

    return res.status(200).json({
      success: true,
      data,
      message: 'Comment settings updated successfully',
    });
  } catch (error) {
    console.error('updateCommentSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update comment settings',
    });
  }
}

export async function updateMaintenanceMode(req, res) {
  try {
    const { enabled, message } = req.body;
    const adminId = req.admin?.id || null;

    const data = {
      enabled: enabled ?? false,
      ...(message !== undefined && { message }),
    };

    await upsertSetting('maintenance', data, adminId);

    return res.status(200).json({
      success: true,
      data,
      message: 'Maintenance mode settings updated successfully',
    });
  } catch (error) {
    console.error('updateMaintenanceMode error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update maintenance mode',
    });
  }
}

export async function updateRegistrationSettings(req, res) {
  try {
    const { enabled, requireEmailVerification, defaultRole, allowedDomains } = req.body;
    const adminId = req.admin?.id || null;

    const data = {
      ...(enabled !== undefined && { enabled }),
      ...(requireEmailVerification !== undefined && { requireEmailVerification }),
      ...(defaultRole !== undefined && { defaultRole }),
      ...(allowedDomains !== undefined && { allowedDomains }),
    };

    await upsertSetting('registration', data, adminId);

    return res.status(200).json({
      success: true,
      data,
      message: 'Registration settings updated successfully',
    });
  } catch (error) {
    console.error('updateRegistrationSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update registration settings',
    });
  }
}

export async function updateUploadSettings(req, res) {
  try {
    const { maxFileSize, allowedTypes, concurrentUploads, storageProvider, cdnEnabled } = req.body;
    const adminId = req.admin?.id || null;

    const data = {
      ...(maxFileSize !== undefined && { maxFileSize }),
      ...(allowedTypes !== undefined && { allowedTypes }),
      ...(concurrentUploads !== undefined && { concurrentUploads }),
      ...(storageProvider !== undefined && { storageProvider }),
      ...(cdnEnabled !== undefined && { cdnEnabled }),
    };

    await upsertSetting('uploadSettings', data, adminId);

    return res.status(200).json({
      success: true,
      data,
      message: 'Upload settings updated successfully',
    });
  } catch (error) {
    console.error('updateUploadSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update upload settings',
    });
  }
}

export async function getPublicConfig(req, res) {
  try {
    const records = await prisma.siteSettings.findMany();
    const settings = {};
    for (const record of records) {
      if (!PUBLIC_KEYS.includes(record.key)) continue;
      try {
        settings[record.key] = JSON.parse(record.value);
      } catch {
        settings[record.key] = record.value;
      }
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('getPublicConfig error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch public config',
    });
  }
}

export async function generateSitemap(req, res) {
  try {
    const videos = await prisma.video.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const baseUrl = req.query.base || 'https://anistrem.com';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;

    for (const cat of categories) {
      xml += `  <url><loc>${baseUrl}/category/${cat.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    }

    for (const vid of videos) {
      xml += `  <url><loc>${baseUrl}/watch/${vid.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    }

    xml += '</urlset>';

    res.set('Content-Type', 'application/xml');
    return res.send(xml);
  } catch (error) {
    console.error('generateSitemap error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate sitemap' });
  }
}

export async function generateRobotsTxt(req, res) {
  try {
    const baseUrl = req.query.base || 'https://anistrem.com';
    let txt = 'User-agent: *\n';
    txt += 'Allow: /\n';
    txt += 'Disallow: /api/\n';
    txt += 'Disallow: /admin/\n';
    txt += `\nSitemap: ${baseUrl}/api/site-settings/sitemap.xml`;

    res.set('Content-Type', 'text/plain');
    return res.send(txt);
  } catch (error) {
    console.error('generateRobotsTxt error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate robots.txt' });
  }
}
