import pool from '../config/db.js';

async function candidateFilterReport(filters = {}, client = pool) {
  const values = [];
  const conditions = ["u.role = 'STUDENT'"];

  if (filters.city) {
    values.push(filters.city);
    conditions.push(`sp.city = $${values.length}`);
  }
  if (filters.course) {
    values.push(filters.course);
    conditions.push(`e.course = $${values.length}`);
  }
  if (filters.batch) {
    values.push(filters.batch);
    conditions.push(`e.batch = $${values.length}`);
  }

  const { rows } = await client.query(
    `
      SELECT u.id, u.name, u.email, sp.city, e.course, e.batch, cv.file_url
      FROM users u
      JOIN student_profiles sp ON u.id = sp.user_id
      JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN cvs cv ON u.id = cv.student_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.created_at DESC
    `,
    values,
  );

  return rows;
}

async function feeDueReport(client = pool) {
  const { rows } = await client.query(
    `
      SELECT
        e.id            AS "id",
        u.name          AS "name",
        e.course        AS "course",
        e.completion_status AS "completionStatus",
        u.phone         AS "phone",
        e.total_fee     AS "totalFee",
        (COALESCE(e.installment1_amount, 0) + COALESCE(e.installment2_amount, 0) + COALESCE(e.installment3_amount, 0))::numeric AS "paidAmount",
        (e.total_fee - COALESCE(e.installment1_amount, 0) - COALESCE(e.installment2_amount, 0) - COALESCE(e.installment3_amount, 0))::numeric AS "pendingAmount",
        COALESCE(
          CURRENT_DATE - GREATEST(e.installment1_date, e.installment2_date, e.installment3_date),
          CURRENT_DATE - e.start_date::date
        )::int AS "daysSinceLastPayment"
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.deleted = FALSE
        AND (e.total_fee - COALESCE(e.installment1_amount, 0) - COALESCE(e.installment2_amount, 0) - COALESCE(e.installment3_amount, 0)) > 0
      ORDER BY "pendingAmount" DESC
    `,
    [],
  );
  return rows;
}

async function enrollmentFigures(client = pool) {
  const { rows } = await client.query(
    `
      SELECT
        course,
        DATE_TRUNC('month', start_date)::date AS month,
        COUNT(*)::int AS total
      FROM enrollments
      WHERE start_date IS NOT NULL
      GROUP BY course, DATE_TRUNC('month', start_date)
      ORDER BY month DESC, course ASC
    `,
  );
  return rows;
}

export { candidateFilterReport, feeDueReport, enrollmentFigures };

export default { candidateFilterReport, feeDueReport, enrollmentFigures };
