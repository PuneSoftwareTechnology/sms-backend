import enrollmentService from "../services/enrollment.service.js";
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

export {
  listEnrollments,
  createEnrollment,
  getEnrollmentById,
  getDistinctCourses,
  updateBatchEndDate,
  updateEnrollment,
  deleteEnrollment,
};

export default {
  listEnrollments,
  createEnrollment,
  getEnrollmentById,
  getDistinctCourses,
  updateBatchEndDate,
  updateEnrollment,
  deleteEnrollment,
};
