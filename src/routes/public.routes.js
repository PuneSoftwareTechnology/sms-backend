import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authController from '../controllers/auth.controller.js';
import testController from '../controllers/test.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { loginSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator.js';

const router = express.Router();

router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/verify-email', validate(verifyEmailSchema), asyncHandler(authController.verifyEmail));
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(authController.resetPassword));
router.post('/logout', authMiddleware, asyncHandler(authController.logout));
router.get('/tests/active', authMiddleware, asyncHandler(testController.getActiveTests));

export default router;
