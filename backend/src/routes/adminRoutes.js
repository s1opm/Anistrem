import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminValidators } from '../middleware/validation.js';

const router = Router();

router.post('/login', adminValidators.login, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, adminValidators.changePassword, authController.changePassword);
router.post('/revoke-all-tokens', authMiddleware, authController.revokeAllTokens);

export default router;
