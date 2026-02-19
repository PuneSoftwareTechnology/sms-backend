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

async function feeDueReport(days, client = pool) {
  const { rows } = await client.query(
    `
      SELECT
        e.id AS enrollment_id,
        e.student_id,
        e.total_fee,
        COALESCE(SUM(p.amount), 0) AS paid_amount,
        (e.total_fee - COALESCE(SUM(p.amount), 0)) AS pending_amount,
        CURRENT_DATE - MAX(p.payment_date) AS days_since_last_payment
      FROM enrollments e
      LEFT JOIN payments p ON e.id = p.enrollment_id
      GROUP BY e.id, e.student_id, e.total_fee
      HAVING (CURRENT_DATE - COALESCE(MAX(p.payment_date), CURRENT_DATE - ($1::int + 1))) >= $1::int
      ORDER BY pending_amount DESC
    `,
    [days],
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
