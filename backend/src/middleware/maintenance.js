import prisma from '../db/index.js';

const CACHE_TTL = 60_000;
let cache = { enabled: false, message: '', expiresAt: 0 };

export async function maintenanceCheck(req, res, next) {
  if (req.path.startsWith('/api/admin')) {
    return next();
  }

  const now = Date.now();
  if (now < cache.expiresAt) {
    if (cache.enabled) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: cache.message || 'System is currently under maintenance. Please try again later.',
      });
    }
    return next();
  }

  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: 'maintenanceMode' },
    });

    const isEnabled = setting?.value === 'true' || setting?.value === true;

    const msgSetting = await prisma.siteSettings.findUnique({
      where: { key: 'maintenanceMessage' },
    });

    cache = {
      enabled: isEnabled,
      message: msgSetting?.value || '',
      expiresAt: now + CACHE_TTL,
    };

    if (isEnabled) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: cache.message || 'System is currently under maintenance. Please try again later.',
      });
    }

    return next();
  } catch (err) {
    cache = { enabled: false, message: '', expiresAt: now + CACHE_TTL };
    return next();
  }
}
