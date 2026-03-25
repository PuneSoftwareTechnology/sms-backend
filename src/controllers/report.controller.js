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
  const filters = {};
  if (req.query.institute && req.query.institute !== 'Combined') {
    filters.institute = req.query.institute;
  }
  if (req.query.year) {
    filters.year = Number(req.query.year);
  }
  const rows = await reportService.enrollmentFigures(filters);
  return ok(res, rows, 'Enrollment figures fetched');
}

async function placementReport(req, res) {
  const result = await reportService.placementReport({
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    course: req.query.course,
    status: req.query.status,
  });
  return ok(res, result, 'Placement report fetched');
}

async function updatePlacementContact(req, res) {
  const { enrollmentId } = req.params;
  const { placementStatus, companyName } = req.body;
  const result = await reportService.updatePlacementContact(enrollmentId, {
    placementStatus,
    companyName,
  });
  return ok(res, result, 'Placement contact updated');
}

export { candidateFilter, feeDue, enrollmentFigures, placementReport, updatePlacementContact };

export default { candidateFilter, feeDue, enrollmentFigures, placementReport, updatePlacementContact };
