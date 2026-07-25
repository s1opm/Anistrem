import prisma from '../db/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const LOCK_DURATION_MS = 30 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

function generateTokens(admin) {
  const accessToken = jwt.sign(
    { id: admin.id, role: admin.role, tokenVersion: admin.tokenVersion ?? 0 },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { id: admin.id, tokenVersion: admin.tokenVersion ?? 0, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
}

function setTokenCookies(res, accessToken, refreshToken) {
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
}

function clearTokenCookies(res) {
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
}

function sanitizeAdmin(admin) {
  const { password, ...rest } = admin;
  return rest;
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400, 'Validation Error');
  }

  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!admin) {
    throw new AppError('Invalid email or password', 401, 'Invalid Credentials');
  }

  if (!admin.isActive) {
    throw new AppError('Account is deactivated', 403, 'Account Deactivated');
  }

  if (admin.lockUntil && admin.lockUntil.getTime() > Date.now()) {
    const minutes = Math.ceil((admin.lockUntil.getTime() - Date.now()) / 60000);
    throw new AppError(
      `Account locked. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}`,
      403,
      'Account Locked'
    );
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    const newAttempts = admin.loginAttempts + 1;
    const updateData = { loginAttempts: newAttempts };

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: updateData,
    });

    throw new AppError('Invalid email or password', 401, 'Invalid Credentials');
  }

  const tokens = generateTokens(admin);

  const updatedAdmin = await prisma.admin.update({
    where: { id: admin.id },
    data: {
      loginAttempts: 0,
      lockUntil: null,
      lastLogin: new Date(),
    },
  });

  setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      admin: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  clearTokenCookies(res);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    throw new AppError('Refresh token required', 401, 'Token Required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.refreshSecret);
  } catch {
    throw new AppError('Invalid refresh token', 401, 'Invalid Token');
  }

  const admin = await prisma.admin.findUnique({
    where: { id: decoded.id },
  });

  if (!admin) {
    throw new AppError('Admin not found', 401, 'Invalid Token');
  }

  if (!admin.isActive) {
    throw new AppError('Account is deactivated', 403, 'Account Deactivated');
  }

  if (decoded.tokenVersion !== (admin.tokenVersion ?? 0)) {
    throw new AppError('Token has been revoked', 401, 'Token Revoked');
  }

  const tokens = generateTokens(admin);

  setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

  res.json({
    success: true,
    message: 'Token refreshed',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const admin = sanitizeAdmin(req.admin);

  res.json({
    success: true,
    data: {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
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
  const adminId = req.admin.id;

  const updateData = {};

  if (email) {
    const normalizedEmail = email.toLowerCase();
    if (normalizedEmail !== req.admin.email) {
      const existing = await prisma.admin.findUnique({
        where: { email: normalizedEmail },
      });

      if (existing) {
        throw new AppError('Email already in use', 400, 'Email Exists');
      }

      updateData.email = normalizedEmail;
    }
  }

  if (name) {
    updateData.name = name;
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No fields to update', 400, 'Validation Error');
  }

  const updatedAdmin = await prisma.admin.update({
    where: { id: adminId },
    data: updateData,
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      admin: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
      },
    },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400, 'Validation Error');
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400, 'Validation Error');
  }

  const admin = await prisma.admin.findUnique({
    where: { id: req.admin.id },
  });

  const isMatch = await bcrypt.compare(currentPassword, admin.password);

  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400, 'Invalid Password');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.admin.update({
    where: { id: req.admin.id },
    data: {
      password: hashedPassword,
      tokenVersion: (admin.tokenVersion ?? 0) + 1,
    },
  });

  clearTokenCookies(res);

  res.json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
  });
});

export const revokeAllTokens = asyncHandler(async (req, res) => {
  const admin = await prisma.admin.findUnique({
    where: { id: req.admin.id },
  });

  await prisma.admin.update({
    where: { id: req.admin.id },
    data: {
      tokenVersion: (admin.tokenVersion ?? 0) + 1,
    },
  });

  clearTokenCookies(res);

  res.json({
    success: true,
    message: 'All sessions revoked. Please log in again.',
  });
});
