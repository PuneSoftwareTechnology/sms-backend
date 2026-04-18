import pool from '../config/db.js';

// ─── Tier 1: Revenue & Financial Health ──────────────────────────────────────

async function getRevenueCollected(filters = {}, client = pool) {
  const values = [];
  const installmentConditions = [];

  if (filters.startDate && filters.endDate) {
    values.push(filters.startDate, filters.endDate);
    installmentConditions.push(
      `CASE WHEN e.installment1_date::date BETWEEN $1 AND $2 THEN COALESCE(e.installment1_amount, 0) ELSE 0 END`,
      `CASE WHEN e.installment2_date::date BETWEEN $1 AND $2 THEN COALESCE(e.installment2_amount, 0) ELSE 0 END`,
      `CASE WHEN e.installment3_date::date BETWEEN $1 AND $2 THEN COALESCE(e.installment3_amount, 0) ELSE 0 END`,
    );
  } else {
    installmentConditions.push(
      `COALESCE(e.installment1_amount, 0)`,
      `COALESCE(e.installment2_amount, 0)`,
      `COALESCE(e.installment3_amount, 0)`,
    );
  }

  const { rows } = await client.query(
    `SELECT COALESCE(SUM(${installmentConditions.join(' + ')}), 0)::numeric AS "totalCollected"
     FROM enrollments e
     WHERE e.deleted = FALSE`,
    values,
  );
  return Number(rows[0].totalCollected);
}

async function getPendingDues(client = pool) {
  const { rows } = await client.query(
    `SELECT COALESCE(SUM(
       e.total_fee
       - COALESCE(e.installment1_amount, 0)
       - COALESCE(e.installment2_amount, 0)
       - COALESCE(e.installment3_amount, 0)
     ), 0)::numeric AS "pendingDues"
     FROM enrollments e
     WHERE e.deleted = FALSE
       AND e.completion_status != 'DROPOUT'
       AND (e.total_fee - COALESCE(e.installment1_amount, 0) - COALESCE(e.installment2_amount, 0) - COALESCE(e.installment3_amount, 0)) > 0`,
  );
  return Number(rows[0].pendingDues);
}

async function getRevenueByCourse(filters = {}, client = pool) {
  const values = [];
  const installmentExprs = [];

  if (filters.startDate && filters.endDate) {
    values.push(filters.startDate, filters.endDate);
    installmentExprs.push(
      `CASE WHEN e.installment1_date::date BETWEEN $1 AND $2 THEN COALESCE(e.installment1_amount, 0) ELSE 0 END`,
      `CASE WHEN e.installment2_date::date BETWEEN $1 AND $2 THEN COALESCE(e.installment2_amount, 0) ELSE 0 END`,
      `CASE WHEN e.installment3_date::date BETWEEN $1 AND $2 THEN COALESCE(e.installment3_amount, 0) ELSE 0 END`,
    );
  } else {
    installmentExprs.push(
      `COALESCE(e.installment1_amount, 0)`,
      `COALESCE(e.installment2_amount, 0)`,
      `COALESCE(e.installment3_amount, 0)`,
    );
  }

  const { rows } = await client.query(
    `SELECT e.course, COALESCE(SUM(${installmentExprs.join(' + ')}), 0)::numeric AS "revenue"
     FROM enrollments e
     WHERE e.deleted = FALSE
     GROUP BY e.course
     ORDER BY "revenue" DESC`,
    values,
  );
  return rows;
}

async function getRevenueByInstitute(filters = {}, client = pool) {
  const values = [];
  const installmentExprs = [];

  if (filters.startDate && filters.endDate) {
    values.push(filters.startDate, filters.endDate);
    installmentExprs.push(
      `CASE WHEN e.installment1_date::date BETWEEN $1 AND $2 THEN COALESCE(e.installment1_amount, 0) ELSE 0 END`,
      `CASE WHEN e.installment2_date::date BETWEEN $1 AND $2 THEN COALESCE(e.installment2_amount, 0) ELSE 0 END`,
      `CASE WHEN e.installment3_date::date BETWEEN $1 AND $2 THEN COALESCE(e.installment3_amount, 0) ELSE 0 END`,
    );
  } else {
    installmentExprs.push(
      `COALESCE(e.installment1_amount, 0)`,
      `COALESCE(e.installment2_amount, 0)`,
      `COALESCE(e.installment3_amount, 0)`,
    );
  }

  const { rows } = await client.query(
    `SELECT e.institute, COALESCE(SUM(${installmentExprs.join(' + ')}), 0)::numeric AS "revenue"
     FROM enrollments e
     WHERE e.deleted = FALSE AND e.institute IS NOT NULL
     GROUP BY e.institute`,
    values,
  );
  return rows;
}

async function getRevenueTrend(client = pool) {
  const { rows } = await client.query(
    `SELECT
       TO_CHAR(d.month, 'Mon YYYY') AS "label",
       COALESCE(SUM(
         CASE WHEN e.installment1_date >= d.month AND e.installment1_date < d.month + INTERVAL '1 month'
              THEN COALESCE(e.installment1_amount, 0) ELSE 0 END +
         CASE WHEN e.installment2_date >= d.month AND e.installment2_date < d.month + INTERVAL '1 month'
              THEN COALESCE(e.installment2_amount, 0) ELSE 0 END +
         CASE WHEN e.installment3_date >= d.month AND e.installment3_date < d.month + INTERVAL '1 month'
              THEN COALESCE(e.installment3_amount, 0) ELSE 0 END
       ), 0)::numeric AS "value"
     FROM generate_series(
       DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
       DATE_TRUNC('month', CURRENT_DATE),
       INTERVAL '1 month'
     ) AS d(month)
     LEFT JOIN enrollments e ON e.deleted = FALSE
     GROUP BY d.month
     ORDER BY d.month`,
  );
  return rows;
}

async function getAverageFee(filters = {}, client = pool) {
  const values = [];
  const conditions = ['e.deleted = FALSE', 'e.total_fee > 0'];

  if (filters.startDate) {
    values.push(filters.startDate);
    conditions.push(`e.created_at::date >= $${values.length}`);
  }
  if (filters.endDate) {
    values.push(filters.endDate);
    conditions.push(`e.created_at::date <= $${values.length}`);
  }

  const { rows } = await client.query(
    `SELECT COALESCE(ROUND(AVG(e.total_fee)), 0)::numeric AS "averageFee"
     FROM enrollments e
     WHERE ${conditions.join(' AND ')}`,
    values,
  );
  return Number(rows[0].averageFee);
}

// ─── Tier 2: Enrollment & Growth ─────────────────────────────────────────────

async function getActiveEnrollments(client = pool) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS "count"
     FROM enrollments e
     WHERE e.deleted = FALSE AND e.completion_status = 'ACTIVE'`,
  );
  return rows[0].count;
}

async function getNewEnrollments(period = 'current', client = pool) {
  const dateExpr = period === 'current'
    ? `e.created_at >= DATE_TRUNC('month', CURRENT_DATE) AND e.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`
    : `e.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND e.created_at < DATE_TRUNC('month', CURRENT_DATE)`;

  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS "count"
     FROM enrollments e
     WHERE e.deleted = FALSE AND ${dateExpr}`,
  );
  return rows[0].count;
}

async function getEnrollmentTrend(client = pool) {
  const { rows } = await client.query(
    `SELECT
       TO_CHAR(d.month, 'Mon YYYY') AS "label",
       COUNT(e.id)::int AS "value"
     FROM generate_series(
       DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
       DATE_TRUNC('month', CURRENT_DATE),
       INTERVAL '1 month'
     ) AS d(month)
     LEFT JOIN enrollments e
       ON e.deleted = FALSE
       AND e.created_at >= d.month
       AND e.created_at < d.month + INTERVAL '1 month'
     GROUP BY d.month
     ORDER BY d.month`,
  );
  return rows;
}

async function getCourseDistribution(filters = {}, client = pool) {
  const values = [];
  const conditions = ['e.deleted = FALSE'];

  if (filters.startDate) {
    values.push(filters.startDate);
    conditions.push(`e.created_at::date >= $${values.length}`);
  }
  if (filters.endDate) {
    values.push(filters.endDate);
    conditions.push(`e.created_at::date <= $${values.length}`);
  }

  const { rows } = await client.query(
    `SELECT e.course, COUNT(*)::int AS "count"
     FROM enrollments e
     WHERE ${conditions.join(' AND ')}
     GROUP BY e.course
     ORDER BY "count" DESC`,
    values,
  );
  return rows;
}

async function getInstituteEnrollments(filters = {}, client = pool) {
  const values = [];
  const conditions = ['e.deleted = FALSE'];

  if (filters.startDate) {
    values.push(filters.startDate);
    conditions.push(`e.created_at::date >= $${values.length}`);
  }
  if (filters.endDate) {
    values.push(filters.endDate);
    conditions.push(`e.created_at::date <= $${values.length}`);
  }

  const { rows } = await client.query(
    `SELECT e.institute, COUNT(*)::int AS "count"
     FROM enrollments e
     WHERE ${conditions.join(' AND ')} AND e.institute IS NOT NULL
     GROUP BY e.institute`,
    values,
  );
  return rows;
}

async function getCompletionBreakdown(client = pool) {
  const { rows } = await client.query(
    `SELECT e.completion_status AS "status", COUNT(*)::int AS "count"
     FROM enrollments e
     WHERE e.deleted = FALSE
     GROUP BY e.completion_status`,
  );
  return rows;
}

// ─── Tier 3: Lead / Enquiry Funnel ──────────────────────────────────────────

async function getEnquiryCount(filters = {}, client = pool) {
  const values = [];
  const conditions = [];

  if (filters.startDate) {
    values.push(filters.startDate);
    conditions.push(`enquiry_date >= $${values.length}`);
  }
  if (filters.endDate) {
    values.push(filters.endDate);
    conditions.push(`enquiry_date <= $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS "count" FROM enquiries ${where}`,
    values,
  );
  return rows[0].count;
}

async function getEnquiriesByStatus(filters = {}, client = pool) {
  const values = [];
  const conditions = [];

  if (filters.startDate) {
    values.push(filters.startDate);
    conditions.push(`enquiry_date >= $${values.length}`);
  }
  if (filters.endDate) {
    values.push(filters.endDate);
    conditions.push(`enquiry_date <= $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT lead_status AS "status", COUNT(*)::int AS "count"
     FROM enquiries ${where}
     GROUP BY lead_status`,
    values,
  );
  return rows;
}

async function getDemoBreakdown(filters = {}, client = pool) {
  const values = [];
  const conditions = [];

  if (filters.startDate) {
    values.push(filters.startDate);
    conditions.push(`enquiry_date >= $${values.length}`);
  }
  if (filters.endDate) {
    values.push(filters.endDate);
    conditions.push(`enquiry_date <= $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT demo_status AS "status", COUNT(*)::int AS "count"
     FROM enquiries ${where}
     GROUP BY demo_status`,
    values,
  );
  return rows;
}

async function getEnquiryTrend(client = pool) {
  const { rows } = await client.query(
    `SELECT
       TO_CHAR(d.month, 'Mon YYYY') AS "label",
       COUNT(eq.id)::int AS "value"
     FROM generate_series(
       DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
       DATE_TRUNC('month', CURRENT_DATE),
       INTERVAL '1 month'
     ) AS d(month)
     LEFT JOIN enquiries eq
       ON eq.enquiry_date >= d.month
       AND eq.enquiry_date < d.month + INTERVAL '1 month'
     GROUP BY d.month
     ORDER BY d.month`,
  );
  return rows;
}

// ─── Tier 4: Placement & Outcomes ───────────────────────────────────────────

async function getPlacementOverall(client = pool) {
  const { rows } = await client.query(
    `SELECT
       COUNT(*) FILTER (WHERE e.placement_status = 'PLACED')::int AS "placed",
       COUNT(*) FILTER (WHERE e.placement_status = 'NOT_PLACED')::int AS "notPlaced",
       COUNT(*)::int AS "total"
     FROM enrollments e
     WHERE e.deleted = FALSE AND e.completion_status = 'COMPLETED'`,
  );
  return rows[0];
}

async function getPlacementByCourse(client = pool) {
  const { rows } = await client.query(
    `SELECT
       e.course,
       COUNT(*) FILTER (WHERE e.placement_status = 'PLACED')::int AS "placed",
       COUNT(*)::int AS "total"
     FROM enrollments e
     WHERE e.deleted = FALSE AND e.completion_status = 'COMPLETED'
     GROUP BY e.course`,
  );
  return rows;
}

async function getAwaitingPlacement(client = pool) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS "count"
     FROM enrollments e
     WHERE e.deleted = FALSE
       AND e.completion_status = 'COMPLETED'
       AND e.placement_status = 'NOT_PLACED'`,
  );
  return rows[0].count;
}

async function getTopHiringCompanies(client = pool) {
  const { rows } = await client.query(
    `SELECT e.company_name AS "company", COUNT(*)::int AS "count"
     FROM enrollments e
     WHERE e.deleted = FALSE
       AND e.placement_status = 'PLACED'
       AND e.company_name IS NOT NULL
       AND e.company_name != ''
     GROUP BY e.company_name
     ORDER BY "count" DESC
     LIMIT 10`,
  );
  return rows;
}

// ─── Tier 5: Recruiter Engagement ───────────────────────────────────────────

async function getActiveRecruiters(client = pool) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS "count"
     FROM users
     WHERE role = 'RECRUITER' AND is_active = true`,
  );
  return rows[0].count;
}

async function getCvDownloads(filters = {}, client = pool) {
  const values = [];
  const conditions = [];

  if (filters.startDate) {
    values.push(filters.startDate);
    conditions.push(`created_at::date >= $${values.length}`);
  }
  if (filters.endDate) {
    values.push(filters.endDate);
    conditions.push(`created_at::date <= $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS "count" FROM recruiter_download_logs ${where}`,
    values,
  );
  return rows[0].count;
}

async function getShortlistCount(filters = {}, client = pool) {
  const values = [];
  const conditions = [];

  if (filters.startDate) {
    values.push(filters.startDate);
    conditions.push(`shortlisted_at::date >= $${values.length}`);
  }
  if (filters.endDate) {
    values.push(filters.endDate);
    conditions.push(`shortlisted_at::date <= $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS "count" FROM recruiter_shortlists ${where}`,
    values,
  );
  return rows[0].count;
}

async function getInDemandCourses(filters = {}, client = pool) {
  const values = [];
  const conditions = [];

  if (filters.startDate) {
    values.push(filters.startDate);
    conditions.push(`shortlisted_at::date >= $${values.length}`);
  }
  if (filters.endDate) {
    values.push(filters.endDate);
    conditions.push(`shortlisted_at::date <= $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT course, COUNT(*)::int AS "count"
     FROM recruiter_shortlists ${where}
     GROUP BY course
     ORDER BY "count" DESC
     LIMIT 5`,
    values,
  );
  return rows;
}

// ─── Tier 6: Assessments & Quality ──────────────────────────────────────────

async function getTechScoreByCourse(client = pool) {
  const { rows } = await client.query(
    `SELECT
       sub.course,
       ROUND(AVG(sub.pct), 1)::numeric AS "avgTechnicalScore"
     FROM (
       SELECT t.course, a.user_id,
         CASE WHEN SUM(a.total_marks) > 0
              THEN (SUM(a.score)::numeric / SUM(a.total_marks)) * 100
              ELSE 0 END AS pct
       FROM attempts a
       JOIN tests t ON a.test_id = t.id
       WHERE a.status IN ('submitted', 'expired')
       GROUP BY t.course, a.user_id
     ) sub
     GROUP BY sub.course`,
  );
  return rows;
}

async function getAvgCommunicationScore(client = pool) {
  const { rows } = await client.query(
    `SELECT COALESCE(ROUND(AVG(ev.communication_score), 1), 0)::numeric AS "score"
     FROM evaluations ev
     JOIN enrollments e ON ev.enrollment_id = e.id AND e.deleted = FALSE
     WHERE ev.communication_score > 0`,
  );
  return Number(rows[0].score);
}

async function getTestCompletion(client = pool) {
  const { rows } = await client.query(
    `SELECT
       (SELECT COUNT(DISTINCT student_id)::int FROM test_attempts) AS "studentsAttempted",
       (SELECT COUNT(*)::int FROM users WHERE role = 'STUDENT' AND is_active = true) AS "totalStudents"`,
  );
  return rows[0];
}

export {
  getRevenueCollected, getPendingDues, getRevenueByCourse, getRevenueByInstitute, getRevenueTrend, getAverageFee,
  getActiveEnrollments, getNewEnrollments, getEnrollmentTrend, getCourseDistribution, getInstituteEnrollments, getCompletionBreakdown,
  getEnquiryCount, getEnquiriesByStatus, getDemoBreakdown, getEnquiryTrend,
  getPlacementOverall, getPlacementByCourse, getAwaitingPlacement, getTopHiringCompanies,
  getActiveRecruiters, getCvDownloads, getShortlistCount, getInDemandCourses,
  getTechScoreByCourse, getAvgCommunicationScore, getTestCompletion,
};

export default {
  getRevenueCollected, getPendingDues, getRevenueByCourse, getRevenueByInstitute, getRevenueTrend, getAverageFee,
  getActiveEnrollments, getNewEnrollments, getEnrollmentTrend, getCourseDistribution, getInstituteEnrollments, getCompletionBreakdown,
  getEnquiryCount, getEnquiriesByStatus, getDemoBreakdown, getEnquiryTrend,
  getPlacementOverall, getPlacementByCourse, getAwaitingPlacement, getTopHiringCompanies,
  getActiveRecruiters, getCvDownloads, getShortlistCount, getInDemandCourses,
  getTechScoreByCourse, getAvgCommunicationScore, getTestCompletion,
};
