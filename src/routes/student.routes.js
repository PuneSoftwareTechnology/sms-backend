import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.middleware.js';
import studentController from '../controllers/student.controller.js';
import { signupSchema, updateProfileSchema  } from '../validators/student.validator.js';
const router = express.Router();

router.post('/signup', validate(signupSchema), asyncHandler(studentController.signup));
router.get('/profile', authMiddleware, asyncHandler(studentController.getMyProfile));
router.put(
  '/profile',
  authMiddleware,
  authorizeRoles('STUDENT'),
  validate(updateProfileSchema),
  asyncHandler(studentController.updateMyProfile),
);
router.get(
  '/:userId/profile',
  authMiddleware,
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'RECRUITER'),
  asyncHandler(studentController.getStudentProfile),
);

export default router;