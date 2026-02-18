import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.middleware.js';
import enrollmentController from '../controllers/enrollment.controller.js';
import { convertEnquirySchema  } from '../validators/enrollment.validator.js';
const router = express.Router();

router.post(
  '/convert-enquiry',
  authMiddleware,
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  validate(convertEnquirySchema),
  asyncHandler(enrollmentController.convertEnquiry),
);

router.get(
  '/:enrollmentId',
  authMiddleware,
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(enrollmentController.getEnrollmentById),
);

export default router;