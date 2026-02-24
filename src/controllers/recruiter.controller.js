import recruiterService from "../services/recruiter.service.js";
import { ok } from "../utils/apiResponse.js";

async function filterCandidates(req, res) {
  const filters = {
    city: req.query.city,
    course: req.query.course,
    minExperience: req.query.minExperience
      ? Number(req.query.minExperience)
      : undefined,
  };

  const candidates = await recruiterService.filterCandidates(filters);
  return ok(res, candidates, "Candidates fetched");
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

async function deleteRecruiter(req, res) {
  const result = await recruiterService.deleteRecruiter(req.params.id);
  return ok(res, result, "Recruiter deleted");
}

async function getAllRecruiters(req, res) {
  const recruiters = await recruiterService.getAllRecruiters();
  return ok(res, recruiters, "Recruiters fetched");
}

export {
  filterCandidates,
  downloadCv,
  getDownloadCount,
  shortlist,
  createRecruiter,
  deleteRecruiter,
  getAllRecruiters,
};

export default {
  filterCandidates,
  downloadCv,
  getDownloadCount,
  shortlist,
  createRecruiter,
  deleteRecruiter,
  getAllRecruiters,
};
