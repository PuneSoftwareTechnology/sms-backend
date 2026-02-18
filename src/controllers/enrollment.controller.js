import bcrypt from 'bcrypt';
import enrollmentService from '../services/enrollment.service.js';
import { ok  } from '../utils/apiResponse.js';
async function convertEnquiry(req, res) {
  const data = req.validated.body;
  const passwordHash = await bcrypt.hash(data.password, 10);

  const enrollment = await enrollmentService.convertEnquiryToEnrollment({
    ...data,
    passwordHash,
  });

  return ok(res, enrollment, 'Enquiry converted to enrollment', 201);
}

async function getEnrollmentById(req, res) {
  const enrollmentId = Number(req.params.enrollmentId);
  const details = await enrollmentService.getEnrollmentDetails(enrollmentId);
  return ok(res, details, 'Enrollment details fetched');
}

export {
convertEnquiry,
  getEnrollmentById,
};

export default {
convertEnquiry,
  getEnrollmentById,
};
