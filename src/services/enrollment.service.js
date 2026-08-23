import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import enrollmentRepository from "../repositories/enrollment.repository.js";
import userRepository from "../repositories/user.repository.js";
import studentRepository from "../repositories/student.repository.js";
import trainerRepository from "../repositories/trainer.repository.js";

/**
 * Trainers are identified by id, not by name — two people can share a name. The
 * `trainer` text column is kept as a denormalized snapshot of that trainer's
 * name so every existing read path (fee dues, candidate reports, CSV exports)
 * keeps working untouched while new code joins on trainer_id.
 *
 * Returns the name to store, or null when the trainer is being cleared.
 */
async function resolveTrainerName(trainerId, client) {
  if (!trainerId) return null;
  const trainer = await trainerRepository.findTrainerById(trainerId, client);
  if (!trainer) throw new ApiError(404, "Trainer not found");
  return trainer.name;
}

async function listEnrollments(filters = {}) {
  const [result, courses, batches] = await Promise.all([
    enrollmentRepository.listEnrollments(filters),
    enrollmentRepository.getDistinctCourses(),
    enrollmentRepository.getDistinctBatches(),
  ]);
  return { ...result, courses, batches };
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
    const trainerId = payload.trainer_id || payload.trainerId || null;
    const trainerName = await resolveTrainerName(trainerId, client);
    const enrollment = await enrollmentRepository.createEnrollment(
      {
        studentId: student.id,
        institute: payload.institute || null,
        course: payload.course,
        batch: payload.batch || null,
        trainer: trainerName ?? payload.trainer ?? null,
        trainerId: trainerId,
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
    if (!enrollment) throw new ApiError(404, "Enrollment not found");

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

    // Assigning or clearing the trainer rewrites the name snapshot with it, so
    // trainer_id and the legacy `trainer` text can never disagree.
    if (enrollmentFields.trainer_id !== undefined) {
      enrollmentFields.trainer = await resolveTrainerName(
        enrollmentFields.trainer_id,
        client,
      );
    }

    await enrollmentRepository.updateEnrollment(enrollmentId, enrollmentFields, client);

    await client.query("COMMIT");
    const updated = await enrollmentRepository.findEnrollmentDetailsById(enrollmentId, client);
    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function softDeleteEnrollment(enrollmentId) {
  const result = await enrollmentRepository.softDeleteEnrollment(enrollmentId);
  if (!result) throw new ApiError(404, "Enrollment not found");
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
