import bcrypt from "bcryptjs";
import ApiError from "../utils/apiError.js";
import pool from "../config/db.js";
import recruiterRepository from "../repositories/recruiter.repository.js";
import enrollmentRepository from "../repositories/enrollment.repository.js";
import userRepository from "../repositories/user.repository.js";
import studentRepository from "../repositories/student.repository.js";
import emailService from "./email.service.js";
import s3Service from "../utils/s3.service.js";

const MAX_DOWNLOADS = 100;

async function filterCandidates(filters, recruiterId) {
  const [paginated, courses, cities, areas, experienceYears] = await Promise.all([
    recruiterRepository.findCandidates(filters, recruiterId),
    enrollmentRepository.getDistinctCompletedCourses(),
    recruiterRepository.getDistinctCities(),
    recruiterRepository.getDistinctAreas(),
    recruiterRepository.getDistinctExperienceYears(),
  ]);

  const resolvedItems = await s3Service.resolvePresignedUrlsInArray(paginated.items, ['cvUrl', 'projectUrl']);
  return { ...paginated, items: resolvedItems, courses, cities, areas, experienceYears };
}

async function downloadCv(recruiterId, studentId) {
  const totalDownloads =
    await recruiterRepository.countRecruiterDownloads(recruiterId);
  if (totalDownloads >= MAX_DOWNLOADS) {
    throw new ApiError(403, "Download limit reached");
  }

  const cv = await studentRepository.findCvByStudentId(studentId);
  if (!cv || !cv.file_url) {
    throw new ApiError(404, "CV not found for this student");
  }

  await recruiterRepository.insertDownloadLog(recruiterId, studentId);

  const signedUrl = await s3Service.getSignedDownloadUrl(cv.file_url, 300);

  emailService.sendCvDownloadNotification({ recruiterId, studentId }).catch(console.error);

  return {
    signedUrl,
    used: totalDownloads + 1,
    limit: MAX_DOWNLOADS,
    remaining: MAX_DOWNLOADS - (totalDownloads + 1),
  };
}

async function getDownloadCount(recruiterId) {
  const used = await recruiterRepository.countRecruiterDownloads(recruiterId);
  return {
    used,
    limit: MAX_DOWNLOADS,
    remaining: Math.max(MAX_DOWNLOADS - used, 0),
  };
}

async function shortlistCandidate(payload) {
  const exists = await recruiterRepository.shortlistExists(payload);
  if (exists) {
    throw new ApiError(409, "Candidate already shortlisted for this course");
  }

  const row = await recruiterRepository.insertShortlist(payload);
  emailService.sendShortlistNotification(payload)
    .catch((err) => console.error('[Email] Shortlist notification failed:', err.message));
  return row;
}

async function removeShortlist(recruiterId, studentId) {
  const removed = await recruiterRepository.removeShortlist(recruiterId, studentId);
  if (!removed) {
    throw new ApiError(404, "Shortlist entry not found");
  }
  return removed;
}

async function getRecruiterShortlist(recruiterId, filters = {}) {
  return recruiterRepository.getRecruiterShortlist(recruiterId, filters);
}

async function getAdminRecruiterShortlist(filters = {}) {
  return recruiterRepository.getAdminRecruiterShortlist(filters);
}

async function bulkRemoveShortlist(recruiterId, studentIds) {
  const removed = await recruiterRepository.bulkRemoveShortlist(recruiterId, studentIds);
  return { removed };
}

async function bulkShortlist(recruiterId, items) {
  const shortlisted = await recruiterRepository.bulkInsertShortlists(recruiterId, items);

  // Send shortlist notifications in the background (fire-and-forget)
  for (const item of items) {
    emailService
      .sendShortlistNotification({ recruiterId, studentId: item.studentId, course: item.course })
      .catch((err) => console.error(`[Email] Bulk shortlist notification failed for ${item.studentId}:`, err.message));
  }

  return { shortlisted, skipped: items.length - shortlisted };
}

async function createRecruiter(payload) {
  // 1. Check if user already exists in users table (by email or phone)
  const existingByEmail = await userRepository.findByEmail(payload.email);
  if (existingByEmail) {
    throw new ApiError(400, "User with this email already exists");
  }

  if (payload.phone) {
    const { rows } = await pool.query("SELECT id FROM users WHERE phone = $1", [
      payload.phone,
    ]);
    if (rows.length > 0) {
      throw new ApiError(400, "User with this phone already exists");
    }
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  return recruiterRepository.createRecruiter({
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    passwordHash,
    companyName: payload.companyName,
    designation: payload.designation,
  });
}

async function updateRecruiter(id, payload) {
  const existing = await recruiterRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, "Recruiter not found");
  }

  if (payload.email && payload.email !== existing.email) {
    const existingByEmail = await userRepository.findByEmail(payload.email);
    if (existingByEmail) {
      throw new ApiError(400, "User with this email already exists");
    }
  }

  if (payload.phone && payload.phone !== existing.phone) {
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE phone = $1 AND id != $2",
      [payload.phone, id],
    );
    if (rows.length > 0) {
      throw new ApiError(400, "User with this phone already exists");
    }
  }

  return recruiterRepository.updateRecruiter(id, payload);
}

async function deleteRecruiter(id) {
  const deleted = await recruiterRepository.deleteRecruiter(id);
  if (!deleted) {
    throw new ApiError(404, "Recruiter not found");
  }
  return deleted;
}

async function getAllRecruiters(filters = {}) {
  return recruiterRepository.listAllRecruiters(filters);
}

async function sendEmailToStudent(recruiterId, studentId, subject, body) {
  const student = await userRepository.findById(studentId);
  if (!student || !student.email) {
    throw new ApiError(404, "Student not found");
  }

  const { sendBulkCustomEmail } = await import('./email.service.js');
  await sendBulkCustomEmail({
    recipients: [{ name: student.name, email: student.email }],
    subject,
    body,
  });

  return { sent: true };
}

export {
  filterCandidates,
  downloadCv,
  getDownloadCount,
  shortlistCandidate,
  bulkShortlist,
  removeShortlist,
  bulkRemoveShortlist,
  getRecruiterShortlist,
  getAdminRecruiterShortlist,
  createRecruiter,
  updateRecruiter,
  deleteRecruiter,
  getAllRecruiters,
  sendEmailToStudent,
};

export default {
  filterCandidates,
  downloadCv,
  getDownloadCount,
  shortlistCandidate,
  bulkShortlist,
  removeShortlist,
  bulkRemoveShortlist,
  getRecruiterShortlist,
  getAdminRecruiterShortlist,
  createRecruiter,
  updateRecruiter,
  deleteRecruiter,
  getAllRecruiters,
  sendEmailToStudent,
};
