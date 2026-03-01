import bcrypt from "bcrypt";
import pool from "../config/db.js";
import enrollmentRepository from "../repositories/enrollment.repository.js";
import userRepository from "../repositories/user.repository.js";
import studentRepository from "../repositories/student.repository.js";

async function listEnrollments(filters = {}) {
  return enrollmentRepository.listEnrollments(filters);
}

async function createCandidateEnrollment(payload) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Generate a default password from the phone or a random string
    const defaultPassword = payload.phone || "Student@123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 1. Create user with STUDENT role
    const student = await userRepository.createUser(
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
        passwordHash,
        role: "STUDENT",
        isActive: true,
        isApproved: false,
        isEmailVerified: false,
      },
      client,
    );

    // 2. Create empty student profile
    await studentRepository.createEmptyProfile(student.id, client);

    // 3. Create enrollment
    const enrollment = await enrollmentRepository.createEnrollment(
      {
        studentId: student.id,
        institute: payload.institute || null,
        course: payload.course,
        batch: payload.batch || null,
        trainer: payload.trainer || null,
        startDate: payload.startDate || null,
        endDate: payload.endDate || null,
        totalFee: payload.totalFees || 0,
      },
      client,
    );

    await client.query("COMMIT");
    return {
      ...enrollment,
      name: student.name,
      email: student.email,
      phone: student.phone,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getEnrollmentDetails(enrollmentId) {
  return enrollmentRepository.findEnrollmentDetailsById(enrollmentId);
}

async function updateBatchEndDate(batch, endDate) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await enrollmentRepository.updateBatchEndDate(batch, endDate, client);
    await enrollmentRepository.markBatchCompleted(batch, client);
    await client.query("COMMIT");
    return { batch, endDate, completionStatus: "COMPLETED" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export {
  listEnrollments,
  createCandidateEnrollment,
  getEnrollmentDetails,
  updateBatchEndDate,
};

export default {
  listEnrollments,
  createCandidateEnrollment,
  getEnrollmentDetails,
  updateBatchEndDate,
};
