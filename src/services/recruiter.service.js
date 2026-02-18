import ApiError from '../utils/apiError.js';
import recruiterRepository from '../repositories/recruiter.repository.js';
import emailService from '../emails/email.service.js';
import s3Service from '../utils/s3.service.js';
const MAX_DOWNLOADS = 100;

async function filterCandidates(filters) {
  return recruiterRepository.findCandidates(filters);
}

async function downloadCv(recruiterId, studentId) {
  const totalDownloads = await recruiterRepository.countRecruiterDownloads(recruiterId);
  if (totalDownloads >= MAX_DOWNLOADS) {
    throw new ApiError(403, 'Download limit reached');
  }

  await recruiterRepository.insertDownloadLog(recruiterId, studentId);

  const key = `cvs/${studentId}.pdf`;
  const signedUrl = await s3Service.getSignedDownloadUrl(key);

  await emailService.sendCvDownloadNotification({ recruiterId, studentId });

  return {
    signedUrl,
    remainingDownloads: MAX_DOWNLOADS - (totalDownloads + 1),
  };
}

async function shortlistCandidate(payload) {
  const row = await recruiterRepository.insertShortlist(payload);
  await emailService.sendShortlistNotification(payload);
  return row;
}

export {
filterCandidates,
  downloadCv,
  shortlistCandidate,
};

export default {
filterCandidates,
  downloadCv,
  shortlistCandidate,
};
