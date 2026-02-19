import pool from '../config/db.js';

async function createTest(payload, client = pool) {
  const { rows } = await client.query(
    `
      INSERT INTO tests (title, duration_minutes, started_at, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [payload.title, payload.durationMinutes ?? 60, payload.startedAt || new Date(), payload.isActive ?? true],
  );
  return rows[0];
}

async function findById(id, client = pool) {
  const { rows } = await client.query('SELECT * FROM tests WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findActiveTests(client = pool) {
  const { rows } = await client.query('SELECT * FROM tests WHERE is_active = true ORDER BY created_at DESC');
  return rows;
}

async function addQuestion(testId, payload, client = pool) {
  const { rows } = await client.query(
    'INSERT INTO questions (test_id, question, correct_answer) VALUES ($1, $2, $3) RETURNING *',
    [testId, payload.question, payload.correctAnswer],
  );
  return rows[0];
}

async function updateQuestion(id, payload, client = pool) {
  const { rows } = await client.query(
    `
      UPDATE questions
      SET question = $1,
          correct_answer = $2
      WHERE id = $3
      RETURNING *
    `,
    [payload.question, payload.correctAnswer, id],
  );
  return rows[0] || null;
}

async function deleteQuestion(id, client = pool) {
  const { rows } = await client.query('DELETE FROM questions WHERE id = $1 RETURNING id', [id]);
  return rows[0] || null;
}

async function findQuestionsByTestId(testId, client = pool) {
  const { rows } = await client.query('SELECT id, correct_answer FROM questions WHERE test_id = $1', [testId]);
  return rows;
}

async function findAttemptByTestAndStudent(testId, studentId, client = pool) {
  const { rows } = await client.query(
    'SELECT id FROM test_attempts WHERE test_id = $1 AND student_id = $2 LIMIT 1',
    [testId, studentId],
  );
  return rows[0] || null;
}

async function insertAttempt(payload, client = pool) {
  const { rows } = await client.query(
    `
      INSERT INTO test_attempts (test_id, student_id, score, total_questions, submitted_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `,
    [payload.testId, payload.studentId, payload.score, payload.totalQuestions],
  );
  return rows[0];
}

export {
  createTest,
  findById,
  findActiveTests,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  findQuestionsByTestId,
  findAttemptByTestAndStudent,
  insertAttempt,
};

export default {
  createTest,
  findById,
  findActiveTests,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  findQuestionsByTestId,
  findAttemptByTestAndStudent,
  insertAttempt,
};
