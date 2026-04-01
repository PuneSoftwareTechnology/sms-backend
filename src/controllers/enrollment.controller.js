import enrollmentService from "../services/enrollment.service.js";
import enrollmentRepository from "../repositories/enrollment.repository.js";
import emailService from "../services/email.service.js";
import generateReceiptPdf, { generateReceiptHtml } from "../utils/receiptPdf.js";
import ApiError from "../utils/apiError.js";
import { ok } from "../utils/apiResponse.js";

async function listEnrollments(req, res) {
  const result = await enrollmentService.listEnrollments({
    enrollment_status: req.query.enrollment_status,
    institute: req.query.institute,
    course: req.query.course,
    page: req.query.page,
    limit: req.query.limit,
  });
  return ok(res, result, "Enrollments fetched");
}

async function createEnrollment(req, res) {
  const enrollment = await enrollmentService.createCandidateEnrollment(
    req.body,
  );
  return ok(res, enrollment, "Candidate enrolled successfully", 201);
}

async function getEnrollmentById(req, res) {
  const details = await enrollmentService.getEnrollmentDetails(
    req.params.enrollmentId,
  );
  return ok(res, details, "Enrollment details fetched");
}

async function getDistinctCourses(req, res) {
  const courses = await enrollmentService.getDistinctCourses();
  return ok(res, courses, "Courses fetched");
}

async function updateBatchEndDate(req, res) {
  const result = await enrollmentService.updateBatchEndDate(
    req.params.batch,
    req.validated.body.endDate,
  );
  return ok(res, result, "Batch updated and enrollment completion cascaded");
}

async function updateEnrollment(req, res) {
  const result = await enrollmentService.updateEnrollment(
    req.params.enrollmentId,
    req.body,
  );
  return ok(res, result, "Enrollment updated successfully");
}

async function deleteEnrollment(req, res) {
  await enrollmentService.softDeleteEnrollment(req.params.enrollmentId);
  return ok(res, null, "Enrollment deleted successfully");
}

async function sendReceipt(req, res) {
  const { enrollmentId, installmentId } = req.params;
  const enrollment = await enrollmentRepository.findEnrollmentDetailsById(enrollmentId);
  if (!enrollment) throw new ApiError(404, "Enrollment not found");
  if (!enrollment.email) throw new ApiError(400, "Student has no email address");

  const num = parseInt(installmentId, 10);
  const amount = enrollment[`installment${num}_amount`];
  const date = enrollment[`installment${num}_date`];
  const mode = enrollment[`installment${num}_mode`];
  if (!amount) throw new ApiError(400, `Installment ${num} has no payment recorded`);

  // Calculate total paid across all installments
  const totalPaid = [1, 2, 3].reduce(
    (sum, i) => sum + (Number(enrollment[`installment${i}_amount`]) || 0),
    0,
  );

  const receiptData = {
    enrollmentId,
    studentName: enrollment.name,
    courseName: enrollment.course,
    institute: enrollment.institute,
    totalFee: Number(enrollment.total_fee),
    amountReceived: Number(amount),
    pendingAmount: Number(enrollment.total_fee) - totalPaid,
    installmentDate: date,
    paymentMode: mode,
  };

  const [receiptPdf, receiptHtml] = await Promise.all([
    generateReceiptPdf(receiptData),
    Promise.resolve(generateReceiptHtml(receiptData)),
  ]);

  await emailService.sendPaymentReceiptEmail({
    to: enrollment.email,
    amount,
    name: enrollment.name,
    receiptPdf,
    receiptHtml,
  });

  return ok(res, null, "Receipt sent successfully");
}

async function sendCertificate(req, res) {
  const { enrollmentId } = req.params;
  const enrollment = await enrollmentRepository.findEnrollmentDetailsById(enrollmentId);
  if (!enrollment) throw new ApiError(404, "Enrollment not found");
  if (!enrollment.email) throw new ApiError(400, "Student has no email address");

  await emailService.sendCertificateEmail({
    to: enrollment.email,
    certificateUrl: enrollment.certificate_url || null,
    name: enrollment.name,
  });

  return ok(res, null, "Certificate sent successfully");
}

export {
  listEnrollments,
  createEnrollment,
  getEnrollmentById,
  getDistinctCourses,
  updateBatchEndDate,
  updateEnrollment,
  deleteEnrollment,
  sendReceipt,
  sendCertificate,
};

export default {
  listEnrollments,
  createEnrollment,
  getEnrollmentById,
  getDistinctCourses,
  updateBatchEndDate,
  updateEnrollment,
  deleteEnrollment,
  sendReceipt,
  sendCertificate,
};
