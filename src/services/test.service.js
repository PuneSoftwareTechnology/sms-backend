import ApiError from '../utils/apiError.js';
import testRepository from '../repositories/test.repository.js';

const GRACE_PERIOD_MS = 30 * 1000; // 30 seconds grace period for network latency

// ─── Admin Functions ─────────────────────────────────────────

async function createTest(payload) {
  // Create test first
  const test = await testRepository.createTest({
    ...payload,
    totalMarks: 0,
    isPublished: payload.isPublished ?? false,
  });

  // Bulk insert questions if provided
  if (payload.questions && payload.questions.length > 0) {
    for (const q of payload.questions) {
      const correctAnswer = q.options[q.correctOptionIndex];
      await testRepository.addQuestion(test.id, {
        question: q.question,
        options: q.options,
        correctAnswer,
        marks: q.marks ?? 1,
      });
    }
    // Recalculate total marks
    await testRepository.recalcTotalMarks(test.id);
  }

  return testRepository.findTestByIdForAdmin(test.id);
}

async function getAllTests() {
  return testRepository.findAllTests();
}

async function getTestByIdForAdmin(testId) {
  const test = await testRepository.findTestByIdForAdmin(testId);
  if (!test) throw new ApiError(404, 'Test not found');
  return test;
}

async function updateTest(testId, payload) {
  const test = await testRepository.findById(testId);
  if (!test) throw new ApiError(404, 'Test not found');
  return testRepository.updateTest(testId, payload);
}

async function addQuestion(testId, payload) {
  const test = await testRepository.findById(testId);
  if (!test) throw new ApiError(404, 'Test not found');

  const question = await testRepository.addQuestion(testId, payload);
  await testRepository.recalcTotalMarks(testId);
  return question;
}

async function updateQuestion(questionId, payload) {
  const updated = await testRepository.updateQuestion(questionId, payload);
  if (!updated) throw new ApiError(404, 'Question not found');

  // Recalculate total marks for the test
  await testRepository.recalcTotalMarks(updated.testId);
  return updated;
}

async function deleteQuestion(questionId) {
  const testId = await testRepository.findQuestionTestId(questionId);
  if (!testId) throw new ApiError(404, 'Question not found');

  const deleted = await testRepository.deleteQuestion(questionId);
  if (!deleted) throw new ApiError(404, 'Question not found');

  await testRepository.recalcTotalMarks(testId);
  return deleted;
}

async function togglePublish(testId) {
  const updated = await testRepository.togglePublish(testId);
  if (!updated) throw new ApiError(404, 'Test not found');
  return updated;
}

async function deleteTest(testId) {
  const deleted = await testRepository.deleteTest(testId);
  if (!deleted) throw new ApiError(404, 'Test not found');
  return deleted;
}

async function getTestAttempts(testId) {
  const test = await testRepository.findById(testId);
  if (!test) throw new ApiError(404, 'Test not found');
  return testRepository.findAttemptsByTestId(testId);
}

// ─── Student Functions ───────────────────────────────────────

async function getAvailableTests(studentId) {
  const tests = await testRepository.findPublishedTests();
  const available = [];
  for (const test of tests) {
    const attempt = await testRepository.findAttemptByUserAndTest(studentId, test.id);
    if (!attempt) {
      // Also check if test is within time window
      const now = new Date();
      const endTime = test.endTime ? new Date(test.endTime) : null;
      if (!endTime || now <= endTime) {
        available.push(test);
      }
    }
  }
  return available;
}

async function startTest(studentId, testId) {
  const test = await testRepository.findById(testId);
  if (!test) throw new ApiError(404, 'Test not found');
  if (!test.isPublished) throw new ApiError(400, 'Test is not published');

  // Check time window
  const now = new Date();
  if (test.endTime && now > new Date(test.endTime)) {
    throw new ApiError(400, 'Test time window has closed');
  }

  // Check existing attempt
  const existingAttempt = await testRepository.findAttemptByUserAndTest(studentId, testId);
  if (existingAttempt) {
    if (existingAttempt.status === 'in_progress') {
      // Check if expired (lazy expiry)
      if (now > new Date(existingAttempt.expiryTime)) {
        await handleExpiredAttempt(existingAttempt.id, testId);
        throw new ApiError(400, 'Your previous attempt has expired');
      }
      // Return the existing in-progress attempt with questions
      const testData = await testRepository.findTestByIdForStudent(testId);
      return {
        attempt: existingAttempt,
        test: testData,
      };
    }
    throw new ApiError(409, 'You have already attempted this test');
  }

  // Create new attempt with server-controlled expiry
  const expiryTime = new Date(now.getTime() + test.durationMinutes * 60 * 1000);
  const attempt = await testRepository.createAttempt(studentId, testId, expiryTime);

  // Get test with questions (no correct answers, randomized)
  const testData = await testRepository.findTestByIdForStudent(testId);

  return {
    attempt,
    test: testData,
  };
}

async function submitTest(attemptId, studentId, answers) {
  const attempt = await testRepository.findAttemptById(attemptId);
  if (!attempt) throw new ApiError(404, 'Attempt not found');
  if (attempt.userId !== studentId) throw new ApiError(403, 'Unauthorized');
  if (attempt.status === 'submitted') throw new ApiError(409, 'Test already submitted');
  if (attempt.status === 'expired') throw new ApiError(400, 'Attempt has expired');

  // Check server-side expiry with grace period
  const now = new Date();
  const expiryWithGrace = new Date(new Date(attempt.expiryTime).getTime() + GRACE_PERIOD_MS);
  if (now > expiryWithGrace) {
    // Auto-expire and score from whatever answers we have
    await handleExpiredAttempt(attemptId, attempt.testId);
    throw new ApiError(400, 'Test submission window has expired');
  }

  // Save all answers
  for (const [questionId, selectedOption] of Object.entries(answers)) {
    await testRepository.saveAnswer(attemptId, questionId, selectedOption);
  }

  // Calculate score
  const questions = await testRepository.findQuestionsByTestId(attempt.testId);
  const { score, totalMarks } = calculateScore(questions, answers);

  // Mark attempt as submitted
  const submittedAttempt = await testRepository.submitAttempt(attemptId, score, totalMarks);

  // Update evaluation technical score (best-effort, may not have evaluation record)
  if (totalMarks > 0) {
    const scoreOutOf10 = Math.round((score / totalMarks) * 10 * 10) / 10;
    await testRepository.updateEvaluationTechnicalScore(studentId, scoreOutOf10);
  }

  return {
    ...submittedAttempt,
    percentage: totalMarks > 0 ? Math.round((score / totalMarks) * 100 * 10) / 10 : 0,
  };
}

// ─── Internal Helpers ────────────────────────────────────────

function calculateScore(questions, answers) {
  let score = 0;
  let totalMarks = 0;

  for (const q of questions) {
    totalMarks += q.marks;
    const selectedIndex = answers[q.id];
    if (selectedIndex !== undefined && selectedIndex !== null) {
      const selectedOption = q.options[Number(selectedIndex)];
      if (selectedOption === q.correctAnswer) {
        score += q.marks;
      }
    }
  }

  return { score, totalMarks };
}

async function handleExpiredAttempt(attemptId, testId) {
  // Get saved answers and calculate score from them
  const savedAnswers = await testRepository.findAnswersByAttemptId(attemptId);
  const questions = await testRepository.findQuestionsByTestId(testId);

  const answerMap = {};
  for (const a of savedAnswers) {
    answerMap[a.questionId] = a.selectedOption;
  }

  const { score, totalMarks } = calculateScore(questions, answerMap);
  await testRepository.expireAttempt(attemptId, score, totalMarks);
}

// ─── Exports ─────────────────────────────────────────────────

export {
  createTest,
  getAllTests,
  getTestByIdForAdmin,
  updateTest,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  togglePublish,
  deleteTest,
  getTestAttempts,
  getAvailableTests,
  startTest,
  submitTest,
};

export default {
  createTest,
  getAllTests,
  getTestByIdForAdmin,
  updateTest,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  togglePublish,
  deleteTest,
  getTestAttempts,
  getAvailableTests,
  startTest,
  submitTest,
};
