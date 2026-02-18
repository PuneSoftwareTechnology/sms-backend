import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.middleware.js';
import enrollmentController from '../controllers/enrollment.controller.js';
import paymentController from '../controllers/payment.controller.js';
import testController from '../controllers/test.controller.js';
import studentController from '../controllers/student.controller.js';
import { convertEnquirySchema  } from '../validators/enrollment.validator.js';
import { createPaymentSchema  } from '../validators/payment.validator.js';
import { createTestSchema  } from '../validators/test.validator.js';
const router = express.Router();

router.use(authMiddleware, authorizeRoles('ADMIN', 'SUPER_ADMIN'));

router.post(
  '/enrollments/convert-enquiry',
  validate(convertEnquirySchema),
  asyncHandler(enrollmentController.convertEnquiry),
);
router.get('/enrollments/:enrollmentId', asyncHandler(enrollmentController.getEnrollmentById));
router.post('/payments', validate(createPaymentSchema), asyncHandler(paymentController.createPayment));
router.post('/tests', validate(createTestSchema), asyncHandler(testController.createTest));
router.get('/students/:userId/profile', asyncHandler(studentController.getStudentProfile));

export default router;