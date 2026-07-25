import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import { config } from '../config/index.js';
import { generateTokens, setTokenCookies, clearTokenCookies, verifyRefreshToken } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;
  
  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password +refreshToken +loginAttempts +lockUntil');
  
  if (!admin) {
    throw new AppError('Invalid email or password', 401, 'Invalid Credentials');
  }
  
  if (!admin.isActive) {
    throw new AppError('Account is deactivated', 403, 'Account Deactivated');
  }
  
  if (admin.lockUntil && admin.lockUntil > Date.now()) {
    const minutes = Math.ceil((admin.lockUntil - Date.now()) / 60000);
    throw new AppError(`Account locked. Try again in ${minutes} minutes`, 403, 'Account Locked');
  }
  
  const isMatch = await admin.comparePassword(password);
  
  if (!isMatch) {
    await admin.incrementLoginAttempts();
    throw new AppError('Invalid email or password', 401, 'Invalid Credentials');
  }
  
  await admin.resetLoginAttempts();
  
  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });
  
  const tokens = generateTokens(admin);

  admin.refreshToken = tokens.refreshToken;
  await admin.save({ validateBeforeSave: false });
  setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.admin) {
    req.admin.refreshToken = undefined;
    await req.admin.save({ validateBeforeSave: false });
  }
  
  clearTokenCookies(res);
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  let token = req.cookies?.refreshToken || req.body?.refreshToken;
  
  if (!token) {
    throw new AppError('Refresh token required', 401, 'Token Required');
  }
  
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    throw new AppError('Invalid refresh token', 401, 'Invalid Token');
  }
  
  const admin = await Admin.findById(decoded.id).select('+refreshToken +tokenVersion');
  
  if (!admin || !admin.isActive) {
    throw new AppError('Admin not found or inactive', 401, 'Invalid Token');
  }
  
  if (admin.refreshToken !== token) {
    admin.refreshToken = undefined;
    await admin.save({ validateBeforeSave: false });
    throw new AppError('Token revoked', 401, 'Token Revoked');
  }
  
  if (decoded.tokenVersion !== (admin.tokenVersion || 0)) {
    throw new AppError('Token version mismatch', 401, 'Token Revoked');
  }
  
  const tokens = generateTokens(admin);
  
  admin.refreshToken = tokens.refreshToken;
  await admin.save({ validateBeforeSave: false });
  
  setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
  
  res.json({
    success: true,
    message: 'Token refreshed',
    data: tokens,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const admin = req.admin;
  
  res.json({
    success: true,
    data: {
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      },
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const admin = req.admin;
  
  if (email && email.toLowerCase() !== admin.email) {
    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) {
      throw new AppError('Email already in use', 400, 'Email Exists');
    }
    admin.email = email.toLowerCase();
  }
  
  if (name) {
    admin.name = name;
  }
  
  await admin.save();
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.admin._id).select('+password');
  
  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400, 'Invalid Password');
  }
  
  admin.password = newPassword;
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  admin.refreshToken = undefined;
  
  await admin.save();
  
  clearTokenCookies(res);
  
  res.json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
  });
});

export const revokeAllTokens = asyncHandler(async (req, res) => {
  req.admin.tokenVersion = (req.admin.tokenVersion || 0) + 1;
  req.admin.refreshToken = undefined;
  await req.admin.save({ validateBeforeSave: false });
  
  clearTokenCookies(res);
  
  res.json({
    success: true,
    message: 'All sessions revoked. Please log in again.',
  });
});