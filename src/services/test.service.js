import ApiError from '../utils/apiError.js';
import testRepository from '../repositories/test.repository.js';

async function createTest(payload) {
  return testRepository.createTest(payload);
}

async function getActiveTests() {
  return testRepository.findActiveTests();
}

async function addQuestion(testId, payload) {
  const test = await testRepository.findById(testId);
  if (!test) {
    throw new ApiError(404, 'Test not found');
  }
  return testRepository.addQuestion(testId, payload);
}

async function updateQuestion(questionId, payload) {
  const updated = await testRepository.updateQuestion(questionId, payload);
  if (!updated) {
    throw new ApiError(404, 'Question not found');
  }
  return updated;
}

async function deleteQuestion(questionId) {
  const deleted = await testRepository.deleteQuestion(questionId);
  if (!deleted) {
    throw new ApiError(404, 'Question not found');
  }
  return deleted;
}

async function submitTest(payload) {
  const test = await testRepository.findById(payload.testId);
  if (!test) {
    throw new ApiError(404, 'Test not found');
  }

  const existingAttempt = await testRepository.findAttemptByTestAndStudent(payload.testId, payload.studentId);
  if (existingAttempt) {
    throw new ApiError(409, 'Test already submitted');
  }

  const deadline = new Date(new Date(test.started_at).getTime() + Number(test.duration_minutes) * 60 * 1000);
  if (new Date() > deadline) {
    throw new ApiError(400, 'Test submission window has expired');
  }

  const questions = await testRepository.findQuestionsByTestId(payload.testId);
  const answerMap = new Map(payload.answers.map((item) => [item.questionId, item.answer]));

  let score = 0;
  for (const q of questions) {
    if (answerMap.get(q.id) === q.correct_answer) {
      score += 1;
    }
  }

  return testRepository.insertAttempt({
    testId: payload.testId,
    studentId: payload.studentId,
    score,
    totalQuestions: questions.length,
  });
}

export { createTest, getActiveTests, addQuestion, updateQuestion, deleteQuestion, submitTest };

export default { createTest, getActiveTests, addQuestion, updateQuestion, deleteQuestion, submitTest };
