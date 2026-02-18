import recruiterService from '../services/recruiter.service.js';
import { ok  } from '../utils/apiResponse.js';
async function filterCandidates(req, res) {
  const filters = {
    city: req.query.city,
    course: req.query.course,
    minExperience: req.query.minExperience ? Number(req.query.minExperience) : undefined,
  };

  const candidates = await recruiterService.filterCandidates(filters);
  return ok(res, candidates, 'Candidates fetched');
}

async function downloadCv(req, res) {
  const { studentId } = req.validated.body;
  const result = await recruiterService.downloadCv(req.user.id, studentId);
  return ok(res, result, 'CV download URL generated');
}

async function shortlist(req, res) {
  const result = await recruiterService.shortlistCandidate({
    recruiterId: req.user.id,
    studentId: req.validated.body.studentId,
    course: req.validated.body.course,
  });

  return ok(res, result, 'Candidate shortlisted', 201);
}

export {
filterCandidates,
  downloadCv,
  shortlist,
};

export default {
filterCandidates,
  downloadCv,
  shortlist,
};
