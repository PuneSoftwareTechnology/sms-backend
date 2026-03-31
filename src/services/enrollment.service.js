import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import enrollmentRepository from "../repositories/enrollment.repository.js";
import userRepository from "../repositories/user.repository.js";
import studentRepository from "../repositories/student.repository.js";

async function listEnrollments(filters = {}) {
  const [result, courses] = await Promise.all([
    enrollmentRepository.listEnrollments(filters),
    enrollmentRepository.getDistinctCourses(),
  ]);
  return { ...result, courses };
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
        startDate: payload.start_date || payload.startDate || null,
        endDate: payload.end_date || payload.endDate || null,
        totalFee: payload.total_fee || payload.totalFee || 0,
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

async function updateEnrollment(enrollmentId, payload) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Update user fields (name, email, phone) if provided
    const enrollment = await enrollmentRepository.findEnrollmentDetailsById(enrollmentId, client);
    if (!enrollment) throw new Error("Enrollment not found");

    if (payload.name || payload.email || payload.phone) {
      const userUpdates = [];
      const userValues = [];
      if (payload.name !== undefined) {
        userValues.push(payload.name);
        userUpdates.push(`name = $${userValues.length}`);
      }
      if (payload.email !== undefined) {
        userValues.push(payload.email);
        userUpdates.push(`email = $${userValues.length}`);
      }
      if (payload.phone !== undefined) {
        userValues.push(payload.phone);
        userUpdates.push(`phone = $${userValues.length}`);
      }
      if (userUpdates.length > 0) {
        userValues.push(enrollment.student_id);
        await client.query(
          `UPDATE users SET ${userUpdates.join(", ")}, updated_at = NOW() WHERE id = $${userValues.length}`,
          userValues,
        );
      }
    }

    // Update enrollment fields
    const { name, email, phone, ...enrollmentFields } = payload;
    await enrollmentRepository.updateEnrollment(enrollmentId, enrollmentFields, client);

    await client.query("COMMIT");
    return await enrollmentRepository.findEnrollmentDetailsById(enrollmentId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function softDeleteEnrollment(enrollmentId) {
  const result = await enrollmentRepository.softDeleteEnrollment(enrollmentId);
  if (!result) throw new Error("Enrollment not found");
  return result;
}

async function getDistinctCourses() {
  return enrollmentRepository.getDistinctCourses();
}

export {
  listEnrollments,
  createCandidateEnrollment,
  getEnrollmentDetails,
  getDistinctCourses,
  updateBatchEndDate,
  updateEnrollment,
  softDeleteEnrollment,
};

export default {
  listEnrollments,
  createCandidateEnrollment,
  getEnrollmentDetails,
  getDistinctCourses,
  updateBatchEndDate,
  updateEnrollment,
  softDeleteEnrollment,
};
