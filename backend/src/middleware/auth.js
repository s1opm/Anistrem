import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../db/index.js';

function generateTokens(admin) {
  const payload = {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    tokenVersion: admin.tokenVersion,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: '7d' });

  return { accessToken, refreshToken };
}

function verifyAccessToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        tokenVersion: true,
      },
    })
      .then((admin) => {
        if (!admin || !admin.isActive) {
          return res.status(401).json({ error: 'Admin not found or inactive' });
        }
        req.admin = admin;
        next();
      })
      .catch(() => {
        return res.status(401).json({ error: 'Invalid token' });
      });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

function setTokenCookies(res, accessToken, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearTokenCookies(res) {
  res.cookie('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}

function authMiddleware(req, res, next) {
  return verifyAccessToken(req, res, next);
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.admin = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        tokenVersion: true,
      },
    })
      .then((admin) => {
        req.admin = admin && admin.isActive ? admin : null;
        next();
      })
      .catch(() => {
        req.admin = null;
        next();
      });
  } catch {
    req.admin = null;
    next();
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Placeholder: extend with a real permission model later
    if (req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    next();
  };
}

function rateLimitAuth(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `auth_rate:${ip}`;
  const now = Date.now();

  if (!globalThis.__authRateLimits) {
    globalThis.__authRateLimits = new Map();
  }

  const record = globalThis.__authRateLimits.get(key);

  if (!record || now - record.windowStart > 15 * 60 * 1000) {
    globalThis.__authRateLimits.set(key, { windowStart: now, count: 1 });
    return next();
  }

  record.count += 1;

  if (record.count > 10) {
    return res.status(429).json({ error: 'Too many authentication attempts, try again later' });
  }

  next();
}

export {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
  authMiddleware,
  optionalAuth,
  requireRole,
  requirePermission,
  rateLimitAuth,
};
