import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authController from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator.js';

const router = express.Router();

router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(authController.resetPassword));
router.post('/logout', authMiddleware, asyncHandler(authController.logout));

export default router;
