import bcrypt from "bcrypt";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import userRepository from "../repositories/user.repository.js";
import studentRepository from "../repositories/student.repository.js";
import enrollmentRepository from "../repositories/enrollment.repository.js";
import emailService from "./email.service.js";
import s3Service from "../utils/s3.service.js";

async function signup(payload) {
  // 1. Check if a user with this email was pre-enrolled by admin
  const existingUser = await userRepository.findByEmail(payload.email);

  if (!existingUser) {
    throw new ApiError(
      400,
      "You are not enrolled. Please contact admin to enroll first.",
    );
  }

  // 2. Verify this user has an enrollment record
  const enrollment = await enrollmentRepository.findByEmail(payload.email);
  if (!enrollment) {
    throw new ApiError(
      400,
      "No enrollment found for this email. Please contact admin.",
    );
  }

  // 3. Check enrollment is approved
  if (enrollment.enrollment_status !== "APPROVED") {
    throw new ApiError(
      403,
      "Your enrollment is not yet approved. Please contact admin for approval.",
    );
  }

  // 5. Activate: update password and mark email as verified (admin already validated identity)
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await userRepository.updatePasswordHash(
      existingUser.id,
      passwordHash,
      client,
    );
    await userRepository.setEmailVerified(existingUser.id, client);

    await client.query("COMMIT");

    return existingUser;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateProfile(userId, payload) {
  const profile = await studentRepository.updateProfile(userId, payload);
  if (!profile) {
    throw new ApiError(404, "Student profile not found");
  }
  return profile;
}

async function getProfile(userId, currentUser) {
  if (currentUser.role === "STUDENT" && currentUser.id !== userId) {
    throw new ApiError(403, "Forbidden");
  }

  const profile = await studentRepository.findFullProfile(userId);
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  return profile;
}

async function approveStudent(studentId) {
  const approved = await userRepository.approveStudent(studentId);
  if (!approved) {
    throw new ApiError(404, "Student not found");
  }
  return approved;
}

async function addCertification(studentId, payload) {
  const certification = await studentRepository.createCertification({
    studentId,
    title: payload.title,
    issuer: payload.issuer,
    issueDate: payload.issueDate,
  });

  const student = await userRepository.findById(studentId);
  if (student) {
    await emailService.sendCertificateEmail({
      to: student.email,
      certificateUrl: "",
    });
  }

  return certification;
}

async function removeCertification(studentId, certificationId) {
  const deleted = await studentRepository.deleteCertification(
    certificationId,
    studentId,
  );
  if (!deleted) {
    throw new ApiError(404, "Certification not found");
  }
  return deleted;
}

async function uploadProject(studentId, file) {
  if (!file) {
    throw new ApiError(400, "Project file is required");
  }

  const key = `projects/${studentId}/${Date.now()}_${file.originalname}`;
  const fileUrl = await s3Service.uploadBuffer(file.buffer, key, file.mimetype);
  return studentRepository.createProjectSubmission(studentId, fileUrl);
}

async function uploadCv(studentId, file) {
  if (!file) {
    throw new ApiError(400, "CV file is required");
  }

  const existingCv = await studentRepository.findCvByStudentId(studentId);

  const key = `cvs/${studentId}.pdf`;
  const fileUrl = await s3Service.uploadBuffer(file.buffer, key, file.mimetype);

  const cv = await studentRepository.upsertCv(studentId, fileUrl);

  if (existingCv && existingCv.file_url && existingCv.file_url !== fileUrl) {
    await s3Service.deleteObjectByUrl(existingCv.file_url);
  }

  return cv;
}

export {
  signup,
  updateProfile,
  getProfile,
  approveStudent,
  addCertification,
  removeCertification,
  uploadProject,
  uploadCv,
};

export default {
  signup,
  updateProfile,
  getProfile,
  approveStudent,
  addCertification,
  removeCertification,
  uploadProject,
  uploadCv,
};
