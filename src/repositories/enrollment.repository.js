import pool from '../config/db.js';

async function createEnrollment(payload, client = pool) {
  const { rows } = await client.query(
    `
      INSERT INTO enrollments (student_id, enquiry_id, course, batch, start_date, end_date, total_fee)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      payload.studentId,
      payload.enquiryId,
      payload.course,
      payload.batch || null,
      payload.startDate || null,
      payload.endDate || null,
      payload.totalFee,
    ],
  );
  return rows[0];
}

async function findEnrollmentDetailsById(enrollmentId, client = pool) {
  const { rows } = await client.query(
    `
      SELECT e.*, u.name, u.email, u.phone
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.id = $1
    `,
    [enrollmentId],
  );
  return rows[0] || null;
}

async function updateBatchEndDate(batch, endDate, client = pool) {
  await client.query(
    'UPDATE enrollments SET end_date = $1, updated_at = NOW() WHERE batch = $2',
    [endDate, batch],
  );
}

async function markBatchCompleted(batch, client = pool) {
  await client.query(
    "UPDATE enrollments SET completion_status = 'COMPLETED', updated_at = NOW() WHERE batch = $1",
    [batch],
  );
}

export { createEnrollment, findEnrollmentDetailsById, updateBatchEndDate, markBatchCompleted };

export default { createEnrollment, findEnrollmentDetailsById, updateBatchEndDate, markBatchCompleted };
