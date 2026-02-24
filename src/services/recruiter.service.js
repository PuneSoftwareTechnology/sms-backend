import bcrypt from "bcrypt";
import ApiError from "../utils/apiError.js";
import recruiterRepository from "../repositories/recruiter.repository.js";
import userRepository from "../repositories/user.repository.js";
import emailService from "./email.service.js";
import s3Service from "../utils/s3.service.js";

const MAX_DOWNLOADS = 100;

async function filterCandidates(filters) {
  return recruiterRepository.findCandidates(filters);
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

async function createRecruiter(payload) {
  const existing = await userRepository.findByEmail(payload.email);
  if (existing) {
    throw new ApiError(409, "Email already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  return userRepository.createUser({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    passwordHash,
    role: "RECRUITER",
    isActive: true,
    isApproved: true,
    isEmailVerified: true,
  });
}

async function deleteRecruiter(id) {
  const deleted = await userRepository.deleteUserByRole(id, "RECRUITER");
  if (!deleted) {
    throw new ApiError(404, "Recruiter not found");
  }
  return deleted;
}

async function getAllRecruiters() {
  return userRepository.listUsersByRole("RECRUITER");
}

export {
  filterCandidates,
  downloadCv,
  getDownloadCount,
  shortlistCandidate,
  createRecruiter,
  deleteRecruiter,
  getAllRecruiters,
};

export default {
  filterCandidates,
  downloadCv,
  getDownloadCount,
  shortlistCandidate,
  createRecruiter,
  deleteRecruiter,
  getAllRecruiters,
};
