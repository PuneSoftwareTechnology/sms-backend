import pool from '../config/db.js';
import userRepository from '../repositories/user.repository.js';
import studentRepository from '../repositories/student.repository.js';
import enrollmentRepository from '../repositories/enrollment.repository.js';
import enquiryRepository from '../repositories/enquiry.repository.js';
async function convertEnquiryToEnrollment(payload) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const student = await userRepository.createUser(
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        passwordHash: payload.passwordHash,
        role: 'STUDENT',
        isActive: true,
        isApproved: false,
      },
      client,
    );

    await studentRepository.createEmptyProfile(student.id, client);

    const enrollment = await enrollmentRepository.createEnrollment(
      {
        studentId: student.id,
        enquiryId: payload.enquiryId,
        course: payload.course,
        totalFee: payload.totalFee,
      },
      client,
    );

    await enquiryRepository.updateLeadStatus(payload.enquiryId, 'ENROLLED', client);

    await client.query('COMMIT');

    return enrollment;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getEnrollmentDetails(enrollmentId) {
  return enrollmentRepository.findEnrollmentDetailsById(enrollmentId);
}

export {
convertEnquiryToEnrollment,
  getEnrollmentDetails,
};

export default {
convertEnquiryToEnrollment,
  getEnrollmentDetails,
};
