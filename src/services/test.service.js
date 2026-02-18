import testRepository from '../repositories/test.repository.js';
async function createTest(payload) {
  return testRepository.createTest(payload);
}

async function getActiveTests() {
  return testRepository.findActiveTests();
}

async function submitTest(payload) {
  const questions = await testRepository.findQuestionsByTestId(payload.testId);

  const answerMap = new Map(payload.answers.map((item) => [Number(item.questionId), item.answer]));

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

export {
createTest,
  getActiveTests,
  submitTest,
};

export default {
createTest,
  getActiveTests,
  submitTest,
};
