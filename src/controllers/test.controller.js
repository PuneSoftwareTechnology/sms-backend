import testService from '../services/test.service.js';
import { ok } from '../utils/apiResponse.js';

async function createTest(req, res) {
  const test = await testService.createTest(req.validated.body);
  return ok(res, test, 'Test created', 201);
}

async function getActiveTests(req, res) {
  const tests = await testService.getActiveTests();
  return ok(res, tests, 'Active tests fetched');
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

async function submitTest(req, res) {
  const attempt = await testService.submitTest({ ...req.validated.body, studentId: req.user.id });
  return ok(res, attempt, 'Test submitted', 201);
}

export { createTest, getActiveTests, addQuestion, updateQuestion, deleteQuestion, submitTest };

export default { createTest, getActiveTests, addQuestion, updateQuestion, deleteQuestion, submitTest };
