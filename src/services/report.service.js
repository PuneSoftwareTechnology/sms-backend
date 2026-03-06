import reportRepository from '../repositories/report.repository.js';
import enrollmentRepository from '../repositories/enrollment.repository.js';

async function candidateFilter(filters) {
  const [items, courses] = await Promise.all([
    reportRepository.candidateFilterReport(filters),
    enrollmentRepository.getDistinctCourses(),
  ]);
  return { items, courses };
}

async function feeDue(days) {
  return reportRepository.feeDueReport(days);
}

async function enrollmentFigures() {
  return reportRepository.enrollmentFigures();
}

export { candidateFilter, feeDue, enrollmentFigures };

export default { candidateFilter, feeDue, enrollmentFigures };
