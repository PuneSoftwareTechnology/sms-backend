import recruiterService from "../services/recruiter.service.js";
import { ok } from "../utils/apiResponse.js";

async function filterCandidates(req, res) {
  const filters = {
    city: req.query.city,
    course: req.query.course,
    minExperience: req.query.minExperience
      ? Number(req.query.minExperience)
      : undefined,
    page: req.query.page,
    limit: req.query.limit,
  };

  const candidates = await recruiterService.filterCandidates(filters, req.user.id);
  return ok(res, candidates, "Candidates fetched");
}

async function downloadCvByParam(req, res) {
  const { studentId } = req.validated.params;
  const result = await recruiterService.downloadCv(req.user.id, studentId);
  return ok(res, result, "CV download URL generated");
}

async function downloadCv(req, res) {
  const { studentId } = req.validated.body;
  const result = await recruiterService.downloadCv(req.user.id, studentId);
  return ok(res, result, "CV download URL generated");
}

async function getDownloadCount(req, res) {
  const result = await recruiterService.getDownloadCount(req.user.id);
  return ok(res, result, "Download count fetched");
}

async function shortlistByParam(req, res) {
  const result = await recruiterService.shortlistCandidate({
    recruiterId: req.user.id,
    studentId: req.validated.params.studentId,
    course: req.validated.body.course,
  });
  return ok(res, result, "Candidate shortlisted", 201);
}

async function removeShortlist(req, res) {
  const result = await recruiterService.removeShortlist(
    req.user.id,
    req.validated.params.studentId,
  );
  return ok(res, result, "Shortlist removed");
}

async function getShortlist(req, res) {
  const shortlist = await recruiterService.getRecruiterShortlist(req.user.id, req.query);
  return ok(res, shortlist, "Shortlist fetched");
}

async function getAdminShortlist(req, res) {
  const shortlist = await recruiterService.getAdminRecruiterShortlist(req.query);
  return ok(res, shortlist, "Recruiter shortlist fetched");
}

async function bulkShortlist(req, res) {
  const result = await recruiterService.bulkShortlist(req.user.id, req.validated.body.items);
  return ok(res, result, `${result.shortlisted} candidates shortlisted`, 201);
}

async function bulkRemoveShortlist(req, res) {
  const result = await recruiterService.bulkRemoveShortlist(req.user.id, req.validated.body.studentIds);
  return ok(res, result, `${result.removed} candidates removed from shortlist`);
}

async function shortlist(req, res) {
  const result = await recruiterService.shortlistCandidate({
    recruiterId: req.user.id,
    studentId: req.validated.body.studentId,
    course: req.validated.body.course,
  });
  return ok(res, result, "Candidate shortlisted", 201);
}

async function createRecruiter(req, res) {
  const recruiter = await recruiterService.createRecruiter(req.validated.body);
  return ok(res, recruiter, "Recruiter created", 201);
}

async function updateRecruiter(req, res) {
  const result = await recruiterService.updateRecruiter(req.params.id, req.validated.body);
  return ok(res, result, "Recruiter updated");
}

async function deleteRecruiter(req, res) {
  const result = await recruiterService.deleteRecruiter(req.params.id);
  return ok(res, result, "Recruiter deleted");
}

async function getAllRecruiters(req, res) {
  const recruiters = await recruiterService.getAllRecruiters(req.query);
  return ok(res, recruiters, "Recruiters fetched");
}

async function sendEmailToStudent(req, res) {
  const { studentId } = req.validated.params;
  const { subject, body } = req.validated.body;
  const result = await recruiterService.sendEmailToStudent(req.user.id, studentId, subject, body);
  return ok(res, result, "Email sent successfully");
}

export {
  filterCandidates,
  downloadCv,
  downloadCvByParam,
  getDownloadCount,
  shortlist,
  shortlistByParam,
  bulkShortlist,
  removeShortlist,
  bulkRemoveShortlist,
  getShortlist,
  getAdminShortlist,
  createRecruiter,
  updateRecruiter,
  deleteRecruiter,
  getAllRecruiters,
  sendEmailToStudent,
};

export default {
  filterCandidates,
  downloadCv,
  downloadCvByParam,
  getDownloadCount,
  shortlist,
  shortlistByParam,
  bulkShortlist,
  removeShortlist,
  bulkRemoveShortlist,
  getShortlist,
  getAdminShortlist,
  createRecruiter,
  updateRecruiter,
  deleteRecruiter,
  getAllRecruiters,
  sendEmailToStudent,
};
