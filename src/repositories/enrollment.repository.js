import pool from '../config/db.js';
async function createEnrollment(payload, client = pool) {
  const query = `
    INSERT INTO enrollments (student_id, enquiry_id, course, total_fee)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [payload.studentId, payload.enquiryId, payload.course, payload.totalFee];
  const { rows } = await client.query(query, values);
  return rows[0];
}

async function findEnrollmentDetailsById(enrollmentId, client = pool) {
  const query = `
    SELECT
      e.*,
      u.name,
      u.email,
      u.phone
    FROM enrollments e
    JOIN users u ON e.student_id = u.id
    WHERE e.id = $1
  `;

  const { rows } = await client.query(query, [enrollmentId]);
  return rows[0] || null;
}

export {
createEnrollment,
  findEnrollmentDetailsById,
};

export default {
createEnrollment,
  findEnrollmentDetailsById,
};
