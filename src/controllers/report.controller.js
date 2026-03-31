import reportService from '../services/report.service.js';
import emailService from '../services/email.service.js';
import { ok } from '../utils/apiResponse.js';

async function candidateFilter(req, res) {
  const rows = await reportService.candidateFilter({
    city: req.query.city,
    course: req.query.course,
    batch: req.query.batch,
    minExperience: req.query.minExperience,
    maxExperience: req.query.maxExperience,
    minTechnicalRating: req.query.minTechnicalRating,
    minCommunicationRating: req.query.minCommunicationRating,
    page: req.query.page,
    limit: req.query.limit,
  });
  return ok(res, rows, 'Candidate filter report fetched');
}

async function downloadBulkCvs(req, res) {
  const { studentIds } = req.body;
  if (!studentIds?.length) {
    return res.status(400).json({ success: false, message: 'No student IDs provided' });
  }
  const cvs = await reportService.getCvsForDownload(studentIds);
  return ok(res, cvs, 'CV URLs fetched');
}

async function sendBulkEmail(req, res) {
  const { studentIds, subject, body } = req.body;
  if (!studentIds?.length || !subject || !body) {
    return res.status(400).json({ success: false, message: 'studentIds, subject, and body are required' });
  }
  const students = await reportService.getStudentEmails(studentIds);
  const results = await emailService.sendBulkCustomEmail({ recipients: students, subject, body });
  return ok(res, results, `${results.sent} email(s) sent successfully`);
}

async function addBulkComment(req, res) {
  const { studentIds, comment } = req.body;
  if (!studentIds?.length || !comment) {
    return res.status(400).json({ success: false, message: 'studentIds and comment are required' });
  }
  await reportService.addBulkComment(studentIds, comment, req.user.id);
  return ok(res, null, 'Comment added successfully');
}

async function feeDue(req, res) {
  const rows = await reportService.feeDue(req.query);
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
    page: req.query.page,
    limit: req.query.limit,
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

export { candidateFilter, feeDue, enrollmentFigures, placementReport, updatePlacementContact, downloadBulkCvs, sendBulkEmail, addBulkComment };

export default { candidateFilter, feeDue, enrollmentFigures, placementReport, updatePlacementContact, downloadBulkCvs, sendBulkEmail, addBulkComment };
