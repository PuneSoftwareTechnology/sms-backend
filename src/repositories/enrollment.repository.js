import pool from "../config/db.js";

async function listEnrollments(filters = {}, client = pool) {
  const values = [];
  const conditions = ["e.deleted = FALSE"];

  if (filters.enrollment_status) {
    values.push(filters.enrollment_status);
    conditions.push(`e.enrollment_status = $${values.length}`);
  }
  if (filters.institute) {
    values.push(filters.institute);
    conditions.push(`e.institute = $${values.length}`);
  }
  if (filters.course) {
    values.push(filters.course);
    conditions.push(`e.course ILIKE '%' || $${values.length} || '%'`);
  }
  const where = conditions.join(" AND ");

  const countResult = await client.query(
    `SELECT COUNT(*) FROM enrollments e LEFT JOIN users u ON e.student_id = u.id WHERE ${where}`,
    values,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 50));
  const offset = (page - 1) * limit;

  values.push(limit);
  values.push(offset);

  const { rows } = await client.query(
    `SELECT e.*, u.name, u.email, u.phone
     FROM enrollments e
     LEFT JOIN users u ON e.student_id = u.id
     WHERE ${where}
     ORDER BY e.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );

  return { items: rows, total, page, totalPages: Math.ceil(total / limit) };
}

async function createEnrollment(payload, client = pool) {
  const { rows } = await client.query(
    `
      INSERT INTO enrollments (student_id, institute, course, batch, trainer, start_date, end_date, total_fee)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      payload.studentId,
      payload.institute || null,
      payload.course,
      payload.batch || null,
      payload.trainer || null,
      payload.startDate || null,
      payload.endDate || null,
      payload.totalFee || 0,
    ],
  );
  return rows[0];
}

async function findEnrollmentDetailsById(enrollmentId, client = pool) {
  const { rows } = await client.query(
    `
      SELECT e.*, u.name, u.email, u.phone
      FROM enrollments e
      LEFT JOIN users u ON e.student_id = u.id
      WHERE e.id = $1
    `,
    [enrollmentId],
  );
  return rows[0] || null;
}

async function updateBatchEndDate(batch, endDate, client = pool) {
  await client.query(
    "UPDATE enrollments SET end_date = $1, updated_at = NOW() WHERE batch = $2",
    [endDate, batch],
  );
}

async function findByEmail(email, client = pool) {
  const { rows } = await client.query(
    `SELECT e.* FROM enrollments e
     JOIN users u ON e.student_id = u.id
     WHERE u.email = $1 LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

async function getDistinctCourses(client = pool) {
  const { rows } = await client.query(
    "SELECT DISTINCT course FROM enrollments WHERE course IS NOT NULL ORDER BY course",
  );
  return rows.map((r) => r.course);
}

async function updateEnrollment(id, payload, client = pool) {
  const fields = [];
  const values = [];

  const enrollmentFields = [
    "institute",
    "course",
    "batch",
    "trainer",
    "start_date",
    "end_date",
    "completion_status",
    "enrollment_status",
    "total_fee",
    "placement_status",
    "company_name",
    "certificate_url",
    "installment1_amount",
    "installment1_date",
    "installment1_mode",
    "installment2_amount",
    "installment2_date",
    "installment2_mode",
    "installment3_amount",
    "installment3_date",
    "installment3_mode",
  ];

  const dateFields = new Set([
    "start_date", "end_date",
    "installment1_date", "installment2_date", "installment3_date",
  ]);

  for (const field of enrollmentFields) {
    if (payload[field] !== undefined) {
      const value = dateFields.has(field) && payload[field] === "" ? null : payload[field];
      values.push(value);
      fields.push(`${field} = $${values.length}`);
    }
  }

  if (fields.length === 0) return null;

  fields.push("updated_at = NOW()");
  values.push(id);

  const { rows } = await client.query(
    `UPDATE enrollments SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values,
  );
  return rows[0] || null;
}

async function softDeleteEnrollment(id, client = pool) {
  const { rows } = await client.query(
    "UPDATE enrollments SET deleted = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id",
    [id],
  );
  return rows[0] || null;
}

async function markBatchCompleted(batch, client = pool) {
  await client.query(
    "UPDATE enrollments SET completion_status = 'COMPLETED', updated_at = NOW() WHERE batch = $1",
    [batch],
  );
}

export {
  listEnrollments,
  createEnrollment,
  findEnrollmentDetailsById,
  findByEmail,
  getDistinctCourses,
  updateBatchEndDate,
  markBatchCompleted,
  updateEnrollment,
  softDeleteEnrollment,
};

export default {
  listEnrollments,
  createEnrollment,
  findEnrollmentDetailsById,
  findByEmail,
  getDistinctCourses,
  updateBatchEndDate,
  markBatchCompleted,
  updateEnrollment,
  softDeleteEnrollment,
};
