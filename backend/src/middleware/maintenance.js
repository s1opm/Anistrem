import SiteSettings from '../models/SiteSettings.js';

let maintenanceCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000;

export const maintenanceCheck = async (req, res, next) => {
  if (req.path.startsWith('/api/') && !req.path.startsWith('/api/site-settings')) {
    try {
      const now = Date.now();
      if (!maintenanceCache || now - cacheTimestamp > CACHE_TTL) {
        maintenanceCache = await SiteSettings.findOne().select('maintenance').lean();
        cacheTimestamp = now;
      }
      if (maintenanceCache?.maintenance?.enabled) {
        const clientIP = req.ip || req.connection?.remoteAddress;
        const allowedIPs = maintenanceCache.maintenance.allowedIPs || [];
        if (allowedIPs.includes(clientIP) || req.path.startsWith('/api/admin/login')) {
          return next();
        }
        return res.status(503).json({
          success: false,
          error: 'Service Unavailable',
          message: maintenanceCache.maintenance.message || 'We are currently performing maintenance.',
        });
      }
    } catch (error) {
      console.error('Maintenance check error:', error);
    }
  }
  next();
};
