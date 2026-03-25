import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import validate from "../middlewares/validate.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/authorize.middleware.js";
import enrollmentController from "../controllers/enrollment.controller.js";
import paymentController from "../controllers/payment.controller.js";
import testController from "../controllers/test.controller.js";
import studentController from "../controllers/student.controller.js";
import recruiterController from "../controllers/recruiter.controller.js";
import enquiryController from "../controllers/enquiry.controller.js";
import reportController from "../controllers/report.controller.js";
import qrController from "../controllers/qr.controller.js";
import { updateBatchEndDateSchema, updateEnrollmentSchema } from "../validators/enrollment.validator.js";
import { createPaymentSchema } from "../validators/payment.validator.js";
import {
  createTestSchema,
  createQuestionSchema,
  updateQuestionSchema,
} from "../validators/test.validator.js";
import { createRecruiterSchema } from "../validators/recruiter.validator.js";
import {
  createEnquirySchema,
  updateEnquirySchema,
  enquiryFilterSchema,
} from "../validators/enquiry.validator.js";
import {
  candidateFilterReportSchema,
  feeDueSchema,
} from "../validators/report.validator.js";
import {
  uuidIdParamSchema,
  userIdParamSchema,
  enrollmentIdParamSchema,
} from "../validators/common.validator.js";

const router = express.Router();

router.use(authMiddleware, authorizeRoles("ADMIN", "SUPER_ADMIN"));

router.get("/enrollments", asyncHandler(enrollmentController.listEnrollments));
router.post(
  "/enrollments",
  asyncHandler(enrollmentController.createEnrollment),
);
router.get(
  "/enrollments/:enrollmentId",
  validate(enrollmentIdParamSchema),
  asyncHandler(enrollmentController.getEnrollmentById),
);
router.put(
  "/enrollments/:enrollmentId",
  validate(updateEnrollmentSchema),
  asyncHandler(enrollmentController.updateEnrollment),
);
router.delete(
  "/enrollments/:enrollmentId",
  validate(enrollmentIdParamSchema),
  asyncHandler(enrollmentController.deleteEnrollment),
);
router.put(
  "/enrollments/batches/:batch/end-date",
  validate(updateBatchEndDateSchema),
  asyncHandler(enrollmentController.updateBatchEndDate),
);

router.post(
  "/payments",
  validate(createPaymentSchema),
  asyncHandler(paymentController.createPayment),
);

router.post(
  "/tests",
  validate(createTestSchema),
  asyncHandler(testController.createTest),
);
router.post(
  "/tests/:id/questions",
  validate(createQuestionSchema),
  asyncHandler(testController.addQuestion),
);
router.put(
  "/questions/:id",
  validate(updateQuestionSchema),
  asyncHandler(testController.updateQuestion),
);
router.delete(
  "/questions/:id",
  validate(uuidIdParamSchema),
  asyncHandler(testController.deleteQuestion),
);

router.get(
  "/students/:userId/profile",
  validate(userIdParamSchema),
  asyncHandler(studentController.getStudentProfile),
);
router.patch(
  "/students/:id/approve",
  validate(uuidIdParamSchema),
  asyncHandler(studentController.approveStudent),
);

router.post(
  "/recruiters",
  validate(createRecruiterSchema),
  asyncHandler(recruiterController.createRecruiter),
);
router.get("/recruiters", asyncHandler(recruiterController.getAllRecruiters));
router.delete(
  "/recruiters/:id",
  validate(uuidIdParamSchema),
  asyncHandler(recruiterController.deleteRecruiter),
);
router.get("/recruiter-shortlist", asyncHandler(recruiterController.getAdminShortlist));

router.get(
  "/enquiries",
  validate(enquiryFilterSchema),
  asyncHandler(enquiryController.listEnquiries),
);
router.post(
  "/enquiries",
  validate(createEnquirySchema),
  asyncHandler(enquiryController.createEnquiry),
);
router.put(
  "/enquiries/:id",
  validate(updateEnquirySchema),
  asyncHandler(enquiryController.updateEnquiry),
);
router.delete(
  "/enquiries/:id",
  validate(uuidIdParamSchema),
  asyncHandler(enquiryController.deleteEnquiry),
);

router.get(
  "/reports/candidate-filter",
  validate(candidateFilterReportSchema),
  asyncHandler(reportController.candidateFilter),
);
router.get(
  "/reports/fee-dues",
  validate(feeDueSchema),
  asyncHandler(reportController.feeDue),
);
router.get(
  "/reports/enrollment-figures",
  asyncHandler(reportController.enrollmentFigures),
);

router.get("/qr-codes", asyncHandler(qrController.listQr));

export default router;
