import bcrypt from "bcrypt";
import ApiError from "../utils/apiError.js";
import pool from "../config/db.js";
import recruiterRepository from "../repositories/recruiter.repository.js";
import enrollmentRepository from "../repositories/enrollment.repository.js";
import userRepository from "../repositories/user.repository.js";
import emailService from "./email.service.js";
import s3Service from "../utils/s3.service.js";

const MAX_DOWNLOADS = 100;

async function filterCandidates(filters, recruiterId) {
  const [items, courses, cities, experienceYears] = await Promise.all([
    recruiterRepository.findCandidates(filters, recruiterId),
    enrollmentRepository.getDistinctCourses(),
    recruiterRepository.getDistinctCities(),
    recruiterRepository.getDistinctExperienceYears(),
  ]);
  return { items, courses, cities, experienceYears };
}

async function downloadCv(recruiterId, studentId) {
  const totalDownloads =
    await recruiterRepository.countRecruiterDownloads(recruiterId);
  if (totalDownloads >= MAX_DOWNLOADS) {
    throw new ApiError(403, "Download limit reached");
  }

  await recruiterRepository.insertDownloadLog(recruiterId, studentId);

  const key = `cvs/${studentId}.pdf`;
  const signedUrl = await s3Service.getSignedDownloadUrl(key, 300);

  await emailService.sendCvDownloadNotification({ recruiterId, studentId });

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
  await emailService.sendShortlistNotification(payload);
  return row;
}

async function removeShortlist(recruiterId, studentId) {
  const removed = await recruiterRepository.removeShortlist(recruiterId, studentId);
  if (!removed) {
    throw new ApiError(404, "Shortlist entry not found");
  }
  return removed;
}

async function getRecruiterShortlist(recruiterId) {
  return recruiterRepository.getRecruiterShortlist(recruiterId);
}

async function getAdminRecruiterShortlist() {
  return recruiterRepository.getAdminRecruiterShortlist();
}

async function bulkRemoveShortlist(recruiterId, studentIds) {
  const removed = await recruiterRepository.bulkRemoveShortlist(recruiterId, studentIds);
  return { removed };
}

async function bulkShortlist(recruiterId, items) {
  const results = { shortlisted: 0, skipped: 0 };
  for (const item of items) {
    const payload = { recruiterId, studentId: item.studentId, course: item.course };
    const exists = await recruiterRepository.shortlistExists(payload);
    if (exists) {
      results.skipped++;
      continue;
    }
    await recruiterRepository.insertShortlist(payload);
    results.shortlisted++;
  }
  return results;
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

async function getAllRecruiters() {
  return recruiterRepository.listAllRecruiters();
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
};
