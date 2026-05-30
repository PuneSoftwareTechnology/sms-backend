import archiver from 'archiver';
import reportService from '../services/report.service.js';
import emailService from '../services/email.service.js';
import s3Service from '../utils/s3.service.js';
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
  const cvs = await reportService.getCvKeysForDownload(studentIds);
  if (!cvs.length) {
    return res.status(404).json({ success: false, message: 'No CVs found for selected candidates' });
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="CVs.zip"');

  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.pipe(res);

  for (const cv of cvs) {
    try {
      const stream = await s3Service.getObjectStream(cv.fileKey);
      const ext = cv.fileKey.split('.').pop() || 'pdf';
      const course = cv.course ? cv.course.replace(/\s+/g, '_') : 'Unknown';
      const fileName = `${cv.name.replace(/\s+/g, '_')}_${course}.${ext}`;
      archive.append(stream, { name: fileName });
    } catch {
      // Skip CVs that can't be fetched from S3
    }
  }

  await archive.finalize();
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

async function downloadSingleCv(req, res) {
  const { studentId } = req.params;
  const cvs = await reportService.getCvKeysForDownload([studentId]);
  if (!cvs.length) {
    return res.status(404).json({ success: false, message: 'No CV found for this candidate' });
  }
  const cv = cvs[0];
  const stream = await s3Service.getObjectStream(cv.fileKey);
  const ext = cv.fileKey.split('.').pop() || 'pdf';
  const fileName = `${cv.name.replace(/\s+/g, '_')}_CV.${ext}`;
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  stream.pipe(res);
}

async function updateCandidateRemark(req, res) {
  const { enrollmentId } = req.params;
  const { studentId, remark } = req.body;
  if (!enrollmentId || !studentId) {
    return res.status(400).json({ success: false, message: 'enrollmentId and studentId are required' });
  }
  const result = await reportService.updateCandidateRemark(enrollmentId, studentId, remark || '');
  return ok(res, result, 'Remark updated successfully');
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
  if (req.query.completion_status && req.query.completion_status !== 'All') {
    filters.completion_status = req.query.completion_status;
  }
  const rows = await reportService.enrollmentFigures(filters);
  return ok(res, rows, 'Enrollment figures fetched');
}

async function enquiryFigures(req, res) {
  const filters = {};
  if (req.query.institute && req.query.institute !== 'Combined') {
    filters.institute = req.query.institute;
  }
  if (req.query.year) {
    filters.year = Number(req.query.year);
  }
  if (req.query.lead_status && req.query.lead_status !== 'All') {
    filters.lead_status = req.query.lead_status;
  }
  if (req.query.demo_status && req.query.demo_status !== 'All') {
    filters.demo_status = req.query.demo_status;
  }
  const rows = await reportService.enquiryFigures(filters);
  return ok(res, rows, 'Enquiry figures fetched');
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

async function revertPlacementContact(req, res) {
  const { enrollmentId } = req.params;
  const result = await reportService.revertPlacementContact(enrollmentId);
  return ok(res, result, 'Placement contact reverted');
}

export { candidateFilter, feeDue, enrollmentFigures, enquiryFigures, placementReport, updatePlacementContact, revertPlacementContact, downloadBulkCvs, downloadSingleCv, sendBulkEmail, addBulkComment, updateCandidateRemark };

export default { candidateFilter, feeDue, enrollmentFigures, enquiryFigures, placementReport, updatePlacementContact, revertPlacementContact, downloadBulkCvs, downloadSingleCv, sendBulkEmail, addBulkComment, updateCandidateRemark };
