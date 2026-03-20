import reportService from '../services/report.service.js';
import { ok } from '../utils/apiResponse.js';

async function candidateFilter(req, res) {
  const rows = await reportService.candidateFilter({
    city: req.query.city,
    course: req.query.course,
    batch: req.query.batch,
  });
  return ok(res, rows, 'Candidate filter report fetched');
}

async function feeDue(req, res) {
  const rows = await reportService.feeDue();
  return ok(res, rows, 'Fee due report fetched');
}

async function enrollmentFigures(req, res) {
  const rows = await reportService.enrollmentFigures();
  return ok(res, rows, 'Enrollment figures fetched');
}

export { candidateFilter, feeDue, enrollmentFigures };

export default { candidateFilter, feeDue, enrollmentFigures };
