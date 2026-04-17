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
import dashboardController from "../controllers/dashboard.controller.js";
import qrController from "../controllers/qr.controller.js";
import cvTemplateController from "../controllers/cvTemplate.controller.js";
import { updateBatchEndDateSchema, updateEnrollmentSchema } from "../validators/enrollment.validator.js";
import { createPaymentSchema } from "../validators/payment.validator.js";
import {
  createTestSchema,
  updateTestSchema,
  createQuestionSchema,
  updateQuestionSchema,
} from "../validators/test.validator.js";
import { createRecruiterSchema, updateRecruiterSchema } from "../validators/recruiter.validator.js";
import {
  createEnquirySchema,
  updateEnquirySchema,
  enquiryFilterSchema,
} from "../validators/enquiry.validator.js";
import {
  candidateFilterReportSchema,
  feeDueSchema,
} from "../validators/report.validator.js";
import { dashboardStatsSchema } from "../validators/dashboard.validator.js";
import { uploadTemplateSchema } from "../validators/cvTemplate.validator.js";
import { docxUpload } from "../middlewares/upload.middleware.js";
import {
  uuidIdParamSchema,
  userIdParamSchema,
  enrollmentIdParamSchema,
  evaluationIdParamSchema,
} from "../validators/common.validator.js";

const router = express.Router();

router.use(authMiddleware, authorizeRoles("ADMIN", "SUPER_ADMIN"));

router.get(
  "/dashboard/stats",
  validate(dashboardStatsSchema),
  asyncHandler(dashboardController.getStats),
);

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

router.get(
  "/enrollments/:enrollmentId/installments/:installmentId/download-receipt",
  asyncHandler(enrollmentController.downloadReceipt),
);
router.post(
  "/enrollments/:enrollmentId/installments/:installmentId/send-receipt",
  asyncHandler(enrollmentController.sendReceipt),
);
router.post(
  "/enrollments/:enrollmentId/send-certificate",
  asyncHandler(enrollmentController.sendCertificate),
);

router.post(
  "/payments",
  validate(createPaymentSchema),
  asyncHandler(paymentController.createPayment),
);

// ─── Test Management ─────────────────────────────────────────
router.get("/tests", asyncHandler(testController.getAllTests));
router.post(
  "/tests",
  validate(createTestSchema),
  asyncHandler(testController.createTest),
);
router.get(
  "/tests/:id",
  validate(uuidIdParamSchema),
  asyncHandler(testController.getTestByIdForAdmin),
);
router.put(
  "/tests/:id",
  validate(updateTestSchema),
  asyncHandler(testController.updateTest),
);
router.post(
  "/tests/:id/toggle-active",
  validate(uuidIdParamSchema),
  asyncHandler(testController.togglePublish),
);
router.delete(
  "/tests/:id",
  validate(uuidIdParamSchema),
  asyncHandler(testController.deleteTest),
);
router.get(
  "/tests/:id/attempts",
  validate(uuidIdParamSchema),
  asyncHandler(testController.getTestAttempts),
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
router.patch(
  "/students/:id/unapprove",
  validate(uuidIdParamSchema),
  asyncHandler(studentController.unapproveStudent),
);

router.put(
  "/evaluations/:evaluationId",
  validate(evaluationIdParamSchema),
  asyncHandler(studentController.updateCommunicationScore),
);

router.post(
  "/recruiters",
  validate(createRecruiterSchema),
  asyncHandler(recruiterController.createRecruiter),
);
router.get("/recruiters", asyncHandler(recruiterController.getAllRecruiters));
router.put(
  "/recruiters/:id",
  validate(updateRecruiterSchema),
  asyncHandler(recruiterController.updateRecruiter),
);
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
  "/reports/candidates",
  validate(candidateFilterReportSchema),
  asyncHandler(reportController.candidateFilter),
);
router.post(
  "/reports/candidates/download-cvs",
  asyncHandler(reportController.downloadBulkCvs),
);
router.post(
  "/reports/candidates/send-email",
  asyncHandler(reportController.sendBulkEmail),
);
router.post(
  "/reports/candidates/add-comment",
  asyncHandler(reportController.addBulkComment),
);
router.put(
  "/reports/candidates/:enrollmentId/remark",
  asyncHandler(reportController.updateCandidateRemark),
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
router.get(
  "/reports/enquiry-figures",
  asyncHandler(reportController.enquiryFigures),
);
router.get(
  "/reports/placement",
  asyncHandler(reportController.placementReport),
);
router.put(
  "/reports/placement/:enrollmentId",
  asyncHandler(reportController.updatePlacementContact),
);

router.get("/qr-codes", asyncHandler(qrController.listQr));

// ─── CV / Resume Templates ─────────────────────────────────────
router.get("/cv-templates", asyncHandler(cvTemplateController.listTemplates));
router.post(
  "/cv-templates",
  docxUpload.single("file"),
  validate(uploadTemplateSchema),
  asyncHandler(cvTemplateController.uploadTemplate),
);
router.delete(
  "/cv-templates/:id",
  validate(uuidIdParamSchema),
  asyncHandler(cvTemplateController.deleteTemplate),
);

export default router;
