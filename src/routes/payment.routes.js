import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.middleware.js';
import paymentController from '../controllers/payment.controller.js';
import { createPaymentSchema  } from '../validators/payment.validator.js';
const router = express.Router();

router.post(
  '/',
  authMiddleware,
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  validate(createPaymentSchema),
  asyncHandler(paymentController.createPayment),
);

export default router;