import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { config } from '../config/index.js';
import { AppError } from './errorHandler.js';

export const generateTokens = (admin) => {
  const accessToken = jwt.sign(
    { id: admin._id, email: admin.email, role: admin.role, tokenVersion: admin.tokenVersion || 0 },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  const refreshToken = jwt.sign(
    { id: admin._id, tokenVersion: admin.tokenVersion || 0, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

export const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = config.nodeEnv === 'production';
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

export const clearTokenCookies = (res) => {
  const isProd = config.nodeEnv === 'production';
  
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
  
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
};

export const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
    
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token Expired',
          message: 'Access token has expired',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid Token',
        message: 'Invalid or malformed token',
      });
    }
    
    const admin = await Admin.findById(decoded.id).select('+refreshToken +tokenVersion');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin not found or inactive',
      });
    }
    
    if (decoded.tokenVersion !== (admin.tokenVersion || 0)) {
      return res.status(401).json({
        success: false,
        error: 'Token Revoked',
        message: 'Token has been revoked',
      });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return next();
    }
    
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      return next();
    }
    
    const admin = await Admin.findById(decoded.id).select('+tokenVersion');
    
    if (admin && admin.isActive && decoded.tokenVersion === (admin.tokenVersion || 0)) {
      req.admin = admin;
    }
    
    next();
  } catch {
    next();
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
    
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
    
    next();
  };
};

export const requirePermission = (permission) => {
  const rolePermissions = {
    superadmin: ['*'],
    admin: ['manage_videos', 'manage_categories', 'manage_admins', 'view_analytics', 'manage_settings'],
    editor: ['manage_videos', 'manage_categories', 'view_analytics'],
    moderator: ['manage_comments', 'view_analytics'],
    viewer: ['view_analytics'],
  };
  
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
    
    const permissions = rolePermissions[req.admin.role] || [];
    
    if (!permissions.includes('*') && !permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Permission '${permission}' required`,
      });
    }
    
    next();
  };
};

export const rateLimitAuth = (req, res, next) => {
  // Handled by express-rate-limit middleware
  next();
};