import reportRepository from '../repositories/report.repository.js';
import enrollmentRepository from '../repositories/enrollment.repository.js';

async function candidateFilter(filters) {
  const [items, courses] = await Promise.all([
    reportRepository.candidateFilterReport(filters),
    enrollmentRepository.getDistinctCourses(),
  ]);
  return { items, courses };
}

async function feeDue() {
  return reportRepository.feeDueReport();
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

async function placementReport(filters) {
  const [notContacted, contacted, courses] = await Promise.all([
    reportRepository.placementNotContacted(filters),
    reportRepository.placementContacted(filters),
    enrollmentRepository.getDistinctCourses(),
  ]);
  return { notContacted, contacted, courses };
}

async function updatePlacementContact(enrollmentId, data) {
  return reportRepository.updatePlacementContact(enrollmentId, data);
}

export { candidateFilter, feeDue, enrollmentFigures, placementReport, updatePlacementContact };

export default { candidateFilter, feeDue, enrollmentFigures, placementReport, updatePlacementContact };
