import reportRepository from '../repositories/report.repository.js';

async function candidateFilter(filters) {
  return reportRepository.candidateFilterReport(filters);
}

async function feeDue(days) {
  return reportRepository.feeDueReport(days);
}

async function enrollmentFigures() {
  return reportRepository.enrollmentFigures();
}

export { candidateFilter, feeDue, enrollmentFigures };

export default { candidateFilter, feeDue, enrollmentFigures };
