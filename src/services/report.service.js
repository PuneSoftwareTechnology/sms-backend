import reportRepository from '../repositories/report.repository.js';
import enrollmentRepository from '../repositories/enrollment.repository.js';
import recruiterRepository from '../repositories/recruiter.repository.js';
import s3Service from '../utils/s3.service.js';

async function candidateFilter(filters) {
  const [paginated, courses, cities] = await Promise.all([
    reportRepository.candidateFilterReport(filters),
    enrollmentRepository.getDistinctCourses(),
    recruiterRepository.getDistinctCities(),
  ]);

  const resolvedItems = await s3Service.resolvePresignedUrlsInArray(paginated.items, ['cvUrl']);
  return { ...paginated, items: resolvedItems, courses, cities };
}

async function addBulkComment(studentIds, comment, addedBy) {
  await reportRepository.addBulkComment(studentIds, comment, addedBy);
}

async function updateCandidateRemark(enrollmentId, studentId, remark) {
  return reportRepository.updateCandidateRemark(enrollmentId, studentId, remark);
}

async function getCvsForDownload(studentIds) {
  const cvs = await reportRepository.getCvsByStudentIds(studentIds);
  return s3Service.resolvePresignedUrlsInArray(cvs, ['fileUrl']);
}

async function getCvKeysForDownload(studentIds) {
  // Returns raw S3 keys (fileKey) — no pre-signed URL resolution
  return reportRepository.getCvKeysByStudentIds(studentIds);
}

async function getStudentEmails(studentIds) {
  return reportRepository.getStudentEmails(studentIds);
}

async function feeDue(filters = {}) {
  return reportRepository.feeDueReport(filters);
}

async function enrollmentFigures(filters) {
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const rows = await reportRepository.enrollmentFigures(filters);

  const courseMap = {};
  for (const row of rows) {
    if (!courseMap[row.course]) {
      courseMap[row.course] = { course: row.course, monthlyData: {}, total: 0 };
    }
    const monthName = MONTH_NAMES[row.month_num - 1];
    courseMap[row.course].monthlyData[monthName] = row.total;
    courseMap[row.course].total += row.total;
  }

  return Object.values(courseMap);
}

async function enquiryFigures(filters) {
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const rows = await reportRepository.enquiryFigures(filters);

  const courseMap = {};
  for (const row of rows) {
    if (!courseMap[row.course]) {
      courseMap[row.course] = { course: row.course, monthlyData: {}, total: 0 };
    }
    const monthName = MONTH_NAMES[row.month_num - 1];
    courseMap[row.course].monthlyData[monthName] = row.total;
    courseMap[row.course].total += row.total;
  }

  return Object.values(courseMap);
}

async function placementReport(filters) {
  const [notContactedResult, contactedResult, courses] = await Promise.all([
    reportRepository.placementNotContacted(filters),
    reportRepository.placementContacted(filters),
    enrollmentRepository.getDistinctCourses(),
  ]);
  return {
    notContacted: notContactedResult.items,
    contacted: contactedResult.items,
    courses,
  };
}

async function updatePlacementContact(enrollmentId, data) {
  return reportRepository.updatePlacementContact(enrollmentId, data);
}

export { candidateFilter, feeDue, enrollmentFigures, enquiryFigures, placementReport, updatePlacementContact, addBulkComment, updateCandidateRemark, getCvsForDownload, getCvKeysForDownload, getStudentEmails };

export default { candidateFilter, feeDue, enrollmentFigures, enquiryFigures, placementReport, updatePlacementContact, addBulkComment, updateCandidateRemark, getCvsForDownload, getCvKeysForDownload, getStudentEmails };
