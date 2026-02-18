import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.middleware.js';
import testController from '../controllers/test.controller.js';
import { createTestSchema, submitTestSchema  } from '../validators/test.validator.js';
const router = express.Router();

router.post(
  '/',
  authMiddleware,
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  validate(createTestSchema),
  asyncHandler(testController.createTest),
);

router.get('/active', authMiddleware, asyncHandler(testController.getActiveTests));

router.post(
  '/submit',
  authMiddleware,
  authorizeRoles('STUDENT'),
  validate(submitTestSchema),
  asyncHandler(testController.submitTest),
);

export default router;