import pool from '../config/db.js';

async function candidateFilterReport(filters = {}, client = pool) {
  const values = [];
  const conditions = ["u.role = 'STUDENT'", "e.deleted = FALSE"];

  if (filters.city && filters.city !== 'ALL') {
    values.push(filters.city);
    conditions.push(`sp.city = $${values.length}`);
  }
  if (filters.course && filters.course !== 'ALL') {
    values.push(filters.course);
    conditions.push(`e.course = $${values.length}`);
  }
  if (filters.batch) {
    values.push(filters.batch);
    conditions.push(`e.batch = $${values.length}`);
  }
  if (filters.minExperience) {
    values.push(Number(filters.minExperience));
    conditions.push(`COALESCE(sp.it_exp_years, 0) >= $${values.length}`);
  }
  if (filters.maxExperience) {
    values.push(Number(filters.maxExperience));
    conditions.push(`COALESCE(sp.it_exp_years, 0) <= $${values.length}`);
  }
  if (filters.minTechnicalRating) {
    values.push(Number(filters.minTechnicalRating));
    conditions.push(`COALESCE(ev.technical_score, 0) >= $${values.length}`);
  }
  if (filters.minCommunicationRating) {
    values.push(Number(filters.minCommunicationRating));
    conditions.push(`COALESCE(ev.communication_score, 0) >= $${values.length}`);
  }

  const { rows } = await client.query(
    `
      SELECT
        u.id,
        u.name,
        e.course,
        sp.city,
        COALESCE(sp.it_exp_years, 0)::int           AS "itExperienceYears",
        COALESCE(ev.technical_score, 0)::numeric     AS "technicalScore",
        COALESCE(ev.communication_score, 0)::numeric AS "communicationScore",
        ev.trainer_remark                            AS "remarks",
        cv.file_url                                  AS "cvUrl"
      FROM users u
      JOIN student_profiles sp ON u.id = sp.user_id
      JOIN enrollments e ON u.id = e.student_id AND e.deleted = FALSE
      LEFT JOIN evaluations ev ON ev.enrollment_id = e.id
      LEFT JOIN cvs cv ON u.id = cv.student_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.name ASC
    `,
    values,
  );

  return rows;
}

async function addBulkComment(studentIds, comment, addedBy, client = pool) {
  const values = studentIds.flatMap((id) => [id, comment, addedBy]);
  const placeholders = studentIds.map((_, i) => {
    const base = i * 3;
    return `($${base + 1}, $${base + 2}, $${base + 3})`;
  }).join(', ');

  await client.query(
    `INSERT INTO candidate_comments (student_id, comment, added_by) VALUES ${placeholders}`,
    values,
  );
}

async function getCvsByStudentIds(studentIds, client = pool) {
  if (!studentIds.length) return [];
  const placeholders = studentIds.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await client.query(
    `
      SELECT cv.student_id AS "studentId", cv.file_url AS "fileUrl", u.name, e.course
      FROM cvs cv
      JOIN users u ON cv.student_id = u.id
      LEFT JOIN enrollments e ON cv.student_id = e.student_id AND e.deleted = FALSE
      WHERE cv.student_id IN (${placeholders})
    `,
    studentIds,
  );
  return rows;
}

async function getStudentEmails(studentIds, client = pool) {
  if (!studentIds.length) return [];
  const placeholders = studentIds.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await client.query(
    `SELECT id, name, email FROM users WHERE id IN (${placeholders})`,
    studentIds,
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

async function enrollmentFigures(filters = {}, client = pool) {
  const values = [];
  const conditions = ['e.start_date IS NOT NULL', 'e.deleted = FALSE'];

  if (filters.institute) {
    values.push(filters.institute);
    conditions.push(`e.institute = $${values.length}`);
  }
  if (filters.year) {
    values.push(filters.year);
    conditions.push(`EXTRACT(YEAR FROM e.start_date) = $${values.length}`);
  }

  const { rows } = await client.query(
    `
      SELECT
        e.course,
        EXTRACT(MONTH FROM e.start_date)::int AS month_num,
        COUNT(*)::int AS total
      FROM enrollments e
      WHERE ${conditions.join(' AND ')}
      GROUP BY e.course, EXTRACT(MONTH FROM e.start_date)
      ORDER BY e.course ASC, month_num ASC
    `,
    values,
  );
  return rows;
}

async function placementNotContacted(filters = {}, client = pool) {
  const values = [];
  const conditions = [
    "e.deleted = FALSE",
    "e.contacted_date IS NULL",
    "e.end_date IS NOT NULL",
    "e.end_date + INTERVAL '60 days' <= CURRENT_DATE",
  ];

  if (filters.fromDate) {
    values.push(filters.fromDate);
    conditions.push(`e.start_date >= $${values.length}`);
  }
  if (filters.toDate) {
    values.push(filters.toDate);
    conditions.push(`e.start_date <= $${values.length}`);
  }

  const { rows } = await client.query(
    `
      SELECT
        e.id,
        u.name,
        u.phone,
        e.course,
        e.end_date          AS "courseEndDate",
        e.placement_status  AS "placementStatus",
        e.company_name      AS "companyName",
        e.contacted_date    AS "contactedDate"
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY e.end_date ASC, u.name ASC
    `,
    values,
  );
  return rows;
}

async function placementContacted(filters = {}, client = pool) {
  const values = [];
  const conditions = [
    "e.deleted = FALSE",
    "e.contacted_date IS NOT NULL",
  ];

  if (filters.fromDate) {
    values.push(filters.fromDate);
    conditions.push(`e.start_date >= $${values.length}`);
  }
  if (filters.toDate) {
    values.push(filters.toDate);
    conditions.push(`e.start_date <= $${values.length}`);
  }
  if (filters.course) {
    values.push(filters.course);
    conditions.push(`e.course = $${values.length}`);
  }
  if (filters.status) {
    values.push(filters.status);
    conditions.push(`e.placement_status = $${values.length}`);
  }

  const { rows } = await client.query(
    `
      SELECT
        e.id,
        u.name,
        u.phone,
        e.course,
        e.end_date          AS "courseEndDate",
        e.placement_status  AS "placementStatus",
        e.company_name      AS "companyName",
        e.contacted_date    AS "contactedDate"
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY e.contacted_date DESC, u.name ASC
    `,
    values,
  );
  return rows;
}

async function updatePlacementContact(enrollmentId, data, client = pool) {
  const { rows } = await client.query(
    `
      UPDATE enrollments
      SET placement_status = $1,
          company_name     = $2,
          contacted_date   = CURRENT_DATE
      WHERE id = $3 AND deleted = FALSE
      RETURNING
        id,
        placement_status  AS "placementStatus",
        company_name      AS "companyName",
        contacted_date    AS "contactedDate"
    `,
    [data.placementStatus, data.companyName || null, enrollmentId],
  );
  return rows[0];
}

export { candidateFilterReport, feeDueReport, enrollmentFigures, placementNotContacted, placementContacted, updatePlacementContact, addBulkComment, getCvsByStudentIds, getStudentEmails };

export default { candidateFilterReport, feeDueReport, enrollmentFigures, placementNotContacted, placementContacted, updatePlacementContact, addBulkComment, getCvsByStudentIds, getStudentEmails };
