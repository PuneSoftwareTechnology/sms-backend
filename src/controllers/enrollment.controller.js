import enrollmentService from '../services/enrollment.service.js';
import { ok } from '../utils/apiResponse.js';

async function convertEnquiry(req, res) {
  const enrollment = await enrollmentService.convertEnquiryToEnrollment(req.validated.body);
  return ok(res, enrollment, 'Enquiry converted to enrollment', 201);
}

async function getEnrollmentById(req, res) {
  const details = await enrollmentService.getEnrollmentDetails(req.params.enrollmentId);
  return ok(res, details, 'Enrollment details fetched');
}

async function updateBatchEndDate(req, res) {
  const result = await enrollmentService.updateBatchEndDate(req.params.batch, req.validated.body.endDate);
  return ok(res, result, 'Batch updated and enrollment completion cascaded');
}

export { convertEnquiry, getEnrollmentById, updateBatchEndDate };

export default { convertEnquiry, getEnrollmentById, updateBatchEndDate };
