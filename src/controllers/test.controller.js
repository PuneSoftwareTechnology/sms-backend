import testService from '../services/test.service.js';
import { ok } from '../utils/apiResponse.js';

// ─── Admin Handlers ──────────────────────────────────────────

async function createTest(req, res) {
  const test = await testService.createTest(req.validated.body);
  return ok(res, test, 'Test created', 201);
}

async function getAllTests(req, res) {
  const tests = await testService.getAllTests(req.query);
  return ok(res, tests, 'All tests fetched');
}

async function getTestByIdForAdmin(req, res) {
  const test = await testService.getTestByIdForAdmin(req.params.id);
  return ok(res, test, 'Test fetched');
}

async function updateTest(req, res) {
  const test = await testService.updateTest(req.params.id, req.validated.body);
  return ok(res, test, 'Test updated');
}

async function togglePublish(req, res) {
  const test = await testService.togglePublish(req.params.id);
  return ok(res, test, 'Test publish status toggled');
}

async function deleteTest(req, res) {
  const result = await testService.deleteTest(req.params.id);
  return ok(res, result, 'Test deleted');
}

async function getTestAttempts(req, res) {
  const attempts = await testService.getTestAttempts(req.params.id, req.query);
  return ok(res, attempts, 'Test attempts fetched');
}

async function addQuestion(req, res) {
  const question = await testService.addQuestion(req.params.id, req.validated.body);
  return ok(res, question, 'Question created', 201);
}

async function updateQuestion(req, res) {
  const question = await testService.updateQuestion(req.params.id, req.validated.body);
  return ok(res, question, 'Question updated');
}

async function deleteQuestion(req, res) {
  const result = await testService.deleteQuestion(req.params.id);
  return ok(res, result, 'Question deleted');
}

// ─── Student Handlers ────────────────────────────────────────

async function getAvailableTests(req, res) {
  const tests = await testService.getAvailableTests(req.user.id);
  return ok(res, tests, 'Available tests fetched');
}

async function startTest(req, res) {
  const result = await testService.startTest(req.user.id, req.params.testId);
  return ok(res, result, 'Test started', 201);
}

async function submitTest(req, res) {
  const result = await testService.submitTest(
    req.validated.body.attemptId,
    req.user.id,
    req.validated.body.answers,
  );
  return ok(res, result, 'Test submitted', 201);
}

// ─── Exports ─────────────────────────────────────────────────

export {
  createTest,
  getAllTests,
  getTestByIdForAdmin,
  updateTest,
  togglePublish,
  deleteTest,
  getTestAttempts,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getAvailableTests,
  startTest,
  submitTest,
};

export default {
  createTest,
  getAllTests,
  getTestByIdForAdmin,
  updateTest,
  togglePublish,
  deleteTest,
  getTestAttempts,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getAvailableTests,
  startTest,
  submitTest,
};
