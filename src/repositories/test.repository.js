import pool from '../config/db.js';

// ─── Test CRUD ───────────────────────────────────────────────

async function createTest(payload, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO tests (title, description, course, duration_minutes, end_time, total_marks, is_published)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, description, course,
               duration_minutes AS "durationMinutes",
               end_time AS "endTime",
               total_marks AS "totalMarks",
               is_active AS "isActive",
               is_published AS "isPublished",
               created_at AS "createdAt"`,
    [
      payload.title,
      payload.description || null,
      payload.course || null,
      payload.durationMinutes ?? 60,
      payload.endTime || null,
      payload.totalMarks ?? 0,
      payload.isPublished ?? false,
    ],
  );
  return rows[0];
}

async function findById(id, client = pool) {
  const { rows } = await client.query(
    `SELECT id, title, description, course,
            duration_minutes AS "durationMinutes",
            end_time AS "endTime",
            total_marks AS "totalMarks",
            is_active AS "isActive",
            is_published AS "isPublished",
            created_at AS "createdAt"
     FROM tests WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

async function findAllTests(client = pool) {
  const { rows } = await client.query(
    `SELECT t.id, t.title, t.description, t.course,
            t.duration_minutes AS "durationMinutes",
            t.end_time AS "endTime",
            t.total_marks AS "totalMarks",
            t.is_active AS "isActive",
            t.is_published AS "isPublished",
            t.created_at AS "createdAt",
            COUNT(q.id)::int AS "questionCount"
     FROM tests t
     LEFT JOIN questions q ON q.test_id = t.id
     GROUP BY t.id
     ORDER BY t.created_at DESC`,
  );
  return rows;
}

async function findPublishedTests(client = pool) {
  const { rows } = await client.query(
    `SELECT t.id, t.title, t.description, t.course,
            t.duration_minutes AS "durationMinutes",
            t.end_time AS "endTime",
            t.total_marks AS "totalMarks",
            t.is_published AS "isPublished",
            t.created_at AS "createdAt",
            COUNT(q.id)::int AS "questionCount"
     FROM tests t
     LEFT JOIN questions q ON q.test_id = t.id
     WHERE t.is_published = true
     GROUP BY t.id
     ORDER BY t.created_at DESC`,
  );
  return rows;
}

async function findPublishedTestsByCourse(course, client = pool) {
  const { rows } = await client.query(
    `SELECT t.id, t.title, t.description, t.course,
            t.duration_minutes AS "durationMinutes",
            t.end_time AS "endTime",
            t.total_marks AS "totalMarks",
            t.is_published AS "isPublished",
            t.created_at AS "createdAt",
            COUNT(q.id)::int AS "questionCount"
     FROM tests t
     LEFT JOIN questions q ON q.test_id = t.id
     WHERE t.is_published = true AND t.course = $1
     GROUP BY t.id
     ORDER BY t.created_at DESC`,
    [course],
  );
  return rows;
}

async function findTestByIdForAdmin(testId, client = pool) {
  const test = await findById(testId, client);
  if (!test) return null;
  const { rows: questions } = await client.query(
    `SELECT id, question, options, correct_option AS "correctAnswer",
            marks, created_at AS "createdAt"
     FROM questions WHERE test_id = $1 ORDER BY created_at`,
    [testId],
  );
  test.questions = questions;
  return test;
}

async function findTestByIdForStudent(testId, client = pool) {
  const { rows } = await client.query(
    `SELECT id, title, description, course,
            duration_minutes AS "durationMinutes",
            end_time AS "endTime",
            total_marks AS "totalMarks",
            is_published AS "isPublished",
            created_at AS "createdAt"
     FROM tests WHERE id = $1 AND is_published = true`,
    [testId],
  );
  const test = rows[0] || null;
  if (!test) return null;
  // Return questions WITHOUT correct answers, shuffled in app
  const { rows: questions } = await client.query(
    `SELECT id, question, options, marks
     FROM questions WHERE test_id = $1 ORDER BY id`,
    [testId],
  );
  // Fisher-Yates shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  test.questions = questions;
  return test;
}

async function updateTest(testId, payload, client = pool) {
  const fields = [];
  const values = [];
  let idx = 1;

  const allowedFields = {
    title: 'title',
    description: 'description',
    course: 'course',
    durationMinutes: 'duration_minutes',
    endTime: 'end_time',
    totalMarks: 'total_marks',
    isPublished: 'is_published',
  };

  for (const [key, col] of Object.entries(allowedFields)) {
    if (payload[key] !== undefined) {
      fields.push(`${col} = $${idx}`);
      values.push(payload[key]);
      idx++;
    }
  }

  if (fields.length === 0) return findById(testId, client);

  values.push(testId);
  const { rows } = await client.query(
    `UPDATE tests SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, title, description, course,
               duration_minutes AS "durationMinutes",
                  end_time AS "endTime",
               total_marks AS "totalMarks",
               is_active AS "isActive",
               is_published AS "isPublished",
               created_at AS "createdAt"`,
    values,
  );
  return rows[0] || null;
}

async function togglePublish(testId, client = pool) {
  const { rows } = await client.query(
    `UPDATE tests SET is_published = NOT is_published WHERE id = $1
     RETURNING id, title, description, course,
               duration_minutes AS "durationMinutes",
                  end_time AS "endTime",
               total_marks AS "totalMarks",
               is_active AS "isActive",
               is_published AS "isPublished",
               created_at AS "createdAt"`,
    [testId],
  );
  return rows[0] || null;
}

async function deleteTest(testId, client = pool) {
  const { rows } = await client.query('DELETE FROM tests WHERE id = $1 RETURNING id', [testId]);
  return rows[0] || null;
}

async function recalcTotalMarks(testId, client = pool) {
  const { rows } = await client.query(
    `UPDATE tests SET total_marks = COALESCE((SELECT SUM(marks) FROM questions WHERE test_id = $1), 0)
     WHERE id = $1
     RETURNING total_marks AS "totalMarks"`,
    [testId],
  );
  return rows[0]?.totalMarks ?? 0;
}

// ─── Question CRUD ───────────────────────────────────────────

async function addQuestion(testId, payload, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO questions (test_id, question, options, correct_option, marks)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, question, options, correct_option AS "correctAnswer",
               marks, created_at AS "createdAt"`,
    [testId, payload.question, payload.options || [], payload.correctAnswer, payload.marks ?? 1],
  );
  return rows[0];
}

async function updateQuestion(id, payload, client = pool) {
  const { rows } = await client.query(
    `UPDATE questions
     SET question = $1, options = $2, correct_option = $3, marks = $4
     WHERE id = $5
     RETURNING id, test_id AS "testId", question, options,
               correct_option AS "correctAnswer", marks,
               created_at AS "createdAt"`,
    [payload.question, payload.options || [], payload.correctAnswer, payload.marks ?? 1, id],
  );
  return rows[0] || null;
}

async function deleteQuestion(id, client = pool) {
  const { rows } = await client.query(
    'DELETE FROM questions WHERE id = $1 RETURNING id, test_id AS "testId"',
    [id],
  );
  return rows[0] || null;
}

async function deleteQuestionsByTestId(testId, client = pool) {
  await client.query('DELETE FROM questions WHERE test_id = $1', [testId]);
}

async function findQuestionsByTestId(testId, client = pool) {
  const { rows } = await client.query(
    `SELECT id, question, options, correct_option AS "correctAnswer", marks
     FROM questions WHERE test_id = $1`,
    [testId],
  );
  return rows;
}

async function findQuestionTestId(questionId, client = pool) {
  const { rows } = await client.query('SELECT test_id AS "testId" FROM questions WHERE id = $1', [questionId]);
  return rows[0]?.testId || null;
}

// ─── Attempt Management ──────────────────────────────────────

async function createAttempt(userId, testId, expiryTime, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO attempts (user_id, test_id, start_time, expiry_time, status)
     VALUES ($1, $2, NOW(), $3, 'in_progress')
     RETURNING id, user_id AS "userId", test_id AS "testId",
               start_time AS "startTime",
               expiry_time AS "expiryTime",
               score, total_marks AS "totalMarks",
               status, created_at AS "createdAt"`,
    [userId, testId, expiryTime],
  );
  return rows[0];
}

async function findAttemptByUserAndTest(userId, testId, client = pool) {
  const { rows } = await client.query(
    `SELECT id, user_id AS "userId", test_id AS "testId",
            start_time AS "startTime", expiry_time AS "expiryTime",
            score, total_marks AS "totalMarks", status,
            submitted_at AS "submittedAt"
     FROM attempts WHERE user_id = $1 AND test_id = $2 LIMIT 1`,
    [userId, testId],
  );
  return rows[0] || null;
}

async function findAttemptById(attemptId, client = pool) {
  const { rows } = await client.query(
    `SELECT id, user_id AS "userId", test_id AS "testId",
            start_time AS "startTime", expiry_time AS "expiryTime",
            score, total_marks AS "totalMarks", status,
            submitted_at AS "submittedAt"
     FROM attempts WHERE id = $1`,
    [attemptId],
  );
  return rows[0] || null;
}

async function submitAttempt(attemptId, score, totalMarks, client = pool) {
  const { rows } = await client.query(
    `UPDATE attempts
     SET score = $1, total_marks = $2, status = 'submitted', submitted_at = NOW()
     WHERE id = $3
     RETURNING id, user_id AS "userId", test_id AS "testId",
               start_time AS "startTime", expiry_time AS "expiryTime",
               score, total_marks AS "totalMarks", status,
               submitted_at AS "submittedAt"`,
    [score, totalMarks, attemptId],
  );
  return rows[0] || null;
}

async function expireAttempt(attemptId, score, totalMarks, client = pool) {
  const { rows } = await client.query(
    `UPDATE attempts
     SET score = $1, total_marks = $2, status = 'expired', submitted_at = NOW()
     WHERE id = $3 AND status = 'in_progress'
     RETURNING id`,
    [score, totalMarks, attemptId],
  );
  return rows[0] || null;
}

async function saveAnswer(attemptId, questionId, selectedOption, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO answers (attempt_id, question_id, selected_option)
     VALUES ($1, $2, $3)
     ON CONFLICT (attempt_id, question_id)
     DO UPDATE SET selected_option = $3
     RETURNING id, attempt_id AS "attemptId", question_id AS "questionId",
               selected_option AS "selectedOption"`,
    [attemptId, questionId, selectedOption],
  );
  return rows[0];
}

async function findAnswersByAttemptId(attemptId, client = pool) {
  const { rows } = await client.query(
    `SELECT id, question_id AS "questionId", selected_option AS "selectedOption"
     FROM answers WHERE attempt_id = $1`,
    [attemptId],
  );
  return rows;
}

async function findAttemptsByTestId(testId, client = pool) {
  const { rows } = await client.query(
    `SELECT a.id, a.user_id AS "studentId", a.score,
            a.total_marks AS "totalMarks", a.status,
            a.start_time AS "startTime",
            a.submitted_at AS "submittedAt",
            u.name AS "studentName", u.email AS "studentEmail"
     FROM attempts a
     JOIN users u ON a.user_id = u.id
     WHERE a.test_id = $1
     ORDER BY a.submitted_at DESC NULLS LAST`,
    [testId],
  );
  return rows;
}

// ─── Evaluation Helpers ─────────────────────────────────────

async function ensureEvaluationExists(studentId, client = pool) {
  const { rowCount } = await client.query(
    'SELECT 1 FROM evaluations WHERE student_id = $1 LIMIT 1',
    [studentId],
  );
  if (rowCount > 0) return;

  // No evaluation exists — find enrollment and create one
  const { rows: enrollments } = await client.query(
    `SELECT id FROM enrollments WHERE student_id = $1 AND deleted = FALSE ORDER BY created_at DESC LIMIT 1`,
    [studentId],
  );

  if (enrollments.length === 0) return;

  await client.query(
    `INSERT INTO evaluations (enrollment_id, student_id, technical_score)
     VALUES ($1, $2, 0)`,
    [enrollments[0].id, studentId],
  );
}

// ─── Legacy compat (old test_attempts table) ─────────────────

async function findAttemptByTestAndStudent(testId, studentId, client = pool) {
  const { rows } = await client.query(
    'SELECT id FROM attempts WHERE test_id = $1 AND user_id = $2 LIMIT 1',
    [testId, studentId],
  );
  return rows[0] || null;
}

// ─── Bulk Operations ────────────────────────────────────────

async function bulkAddQuestions(testId, questions, client = pool) {
  if (!questions.length) return [];
  const values = [];
  const placeholders = questions.map((q, i) => {
    const base = i * 5;
    values.push(testId, q.question, q.options || [], q.correctAnswer, q.marks ?? 1);
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
  });
  const { rows } = await client.query(
    `INSERT INTO questions (test_id, question, options, correct_option, marks)
     VALUES ${placeholders.join(', ')}
     RETURNING id, question, options, correct_option AS "correctAnswer",
               marks, created_at AS "createdAt"`,
    values,
  );
  return rows;
}

async function bulkSaveAnswers(attemptId, answers, client = pool) {
  const entries = Object.entries(answers);
  if (!entries.length) return [];
  const values = [];
  const placeholders = entries.map(([questionId, selectedOption], i) => {
    const base = i * 3;
    values.push(attemptId, questionId, selectedOption);
    return `($${base + 1}, $${base + 2}, $${base + 3})`;
  });
  const { rows } = await client.query(
    `INSERT INTO answers (attempt_id, question_id, selected_option)
     VALUES ${placeholders.join(', ')}
     ON CONFLICT (attempt_id, question_id)
     DO UPDATE SET selected_option = EXCLUDED.selected_option
     RETURNING id, attempt_id AS "attemptId", question_id AS "questionId",
               selected_option AS "selectedOption"`,
    values,
  );
  return rows;
}

async function findAttemptedTestIdsByUser(userId, testIds, client = pool) {
  if (!testIds.length) return new Set();
  const { rows } = await client.query(
    `SELECT test_id AS "testId" FROM attempts
     WHERE user_id = $1 AND test_id = ANY($2::uuid[])`,
    [userId, testIds],
  );
  return new Set(rows.map(r => r.testId));
}

// ─── Exports ─────────────────────────────────────────────────

export {
  createTest,
  findById,
  findAllTests,
  findPublishedTests,
  findPublishedTestsByCourse,
  findTestByIdForAdmin,
  findTestByIdForStudent,
  updateTest,
  togglePublish,
  deleteTest,
  recalcTotalMarks,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  deleteQuestionsByTestId,
  findQuestionsByTestId,
  findQuestionTestId,
  createAttempt,
  findAttemptByUserAndTest,
  findAttemptById,
  submitAttempt,
  expireAttempt,
  saveAnswer,
  findAnswersByAttemptId,
  findAttemptsByTestId,
  ensureEvaluationExists,
  findAttemptByTestAndStudent,
  bulkAddQuestions,
  bulkSaveAnswers,
  findAttemptedTestIdsByUser,
};

export default {
  createTest,
  findById,
  findAllTests,
  findPublishedTests,
  findPublishedTestsByCourse,
  findTestByIdForAdmin,
  findTestByIdForStudent,
  updateTest,
  togglePublish,
  deleteTest,
  recalcTotalMarks,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  deleteQuestionsByTestId,
  findQuestionsByTestId,
  findQuestionTestId,
  createAttempt,
  findAttemptByUserAndTest,
  findAttemptById,
  submitAttempt,
  expireAttempt,
  saveAnswer,
  findAnswersByAttemptId,
  findAttemptsByTestId,
  ensureEvaluationExists,
  findAttemptByTestAndStudent,
  bulkAddQuestions,
  bulkSaveAnswers,
  findAttemptedTestIdsByUser,
};
