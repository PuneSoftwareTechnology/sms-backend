import pool from '../config/db.js';
async function createTest(payload, client = pool) {
  const query = `
    INSERT INTO tests (title, is_active)
    VALUES ($1, $2)
    RETURNING *
  `;
  const { rows } = await client.query(query, [payload.title, payload.isActive ?? true]);
  return rows[0];
}

async function findActiveTests(client = pool) {
  const query = 'SELECT * FROM tests WHERE is_active = true ORDER BY id DESC';
  const { rows } = await client.query(query);
  return rows;
}

async function findQuestionsByTestId(testId, client = pool) {
  const query = `
    SELECT id, correct_answer
    FROM questions
    WHERE test_id = $1
  `;

  const { rows } = await client.query(query, [testId]);
  return rows;
}

async function insertAttempt(payload, client = pool) {
  const query = `
    INSERT INTO test_attempts (test_id, student_id, score, total_questions)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [payload.testId, payload.studentId, payload.score, payload.totalQuestions];
  const { rows } = await client.query(query, values);
  return rows[0];
}

export {
createTest,
  findActiveTests,
  findQuestionsByTestId,
  insertAttempt,
};

export default {
createTest,
  findActiveTests,
  findQuestionsByTestId,
  insertAttempt,
};
