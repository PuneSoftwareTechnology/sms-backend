import pool from "../config/db.js";
import { parsePagination, paginatedResult } from '../validators/common.validator.js';

async function findCandidates(filters = {}, recruiterId, client = pool) {
  const { page, limit, offset } = parsePagination(filters);

  // Build filter conditions — count query params start at $1
  const filterValues = [];
  const conditions = ["u.role = 'STUDENT'", "u.is_approved = true", "e.completion_status = 'COMPLETED'"];

  if (filters.city) {
    filterValues.push(filters.city);
    conditions.push(`sp.city = $${filterValues.length}`);
  }
  if (filters.area) {
    filterValues.push(filters.area);
    conditions.push(`sp.area = $${filterValues.length}`);
  }
  if (filters.course) {
    filterValues.push(filters.course);
    conditions.push(`e.course = $${filterValues.length}`);
  }
  if (filters.minExperience !== undefined) {
    filterValues.push(filters.minExperience);
    conditions.push(`COALESCE(sp.it_exp_years, 0) >= $${filterValues.length}`);
  }
  if (filters.maxExperience !== undefined) {
    filterValues.push(filters.maxExperience);
    conditions.push(`COALESCE(sp.it_exp_years, 0) <= $${filterValues.length}`);
  }

  const whereClause = conditions.join(" AND ");

  // Count query — no recruiterId needed
  const countResult = await client.query(
    `SELECT COUNT(*)::int AS total
     FROM users u
     LEFT JOIN student_profiles sp ON u.id = sp.user_id
     LEFT JOIN enrollments e ON u.id = e.student_id AND e.deleted = FALSE
     WHERE ${whereClause}`,
    filterValues,
  );
  const total = countResult.rows[0].total;

  // Main query — $1 = recruiterId, filter params shift by +1, then limit/offset
  const mainWhere = filterValues.length > 0
    ? whereClause.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + 1}`)
    : whereClause;
  const mainValues = [recruiterId, ...filterValues, limit, offset];

  const { rows } = await client.query(
    `
      SELECT
        u.id,
        u.name,
        sp.city,
        sp.area,
        e.course,
        COALESCE(sp.it_exp_years, 0)  AS "itExperienceYears",
        COALESCE(sp.it_exp_months, 0) AS "itExperienceMonths",
        COALESCE(ts.marks_scored, 0)::int  AS "technicalMarksScored",
        COALESCE(ts.total_marks, 0)::int   AS "technicalTotalMarks",
        COALESCE(ev.communication_score, 0)::numeric AS "communicationScore",
        cv.file_url                   AS "cvUrl",
        ps.file_url                   AS "projectUrl",
        CASE WHEN rs.id IS NOT NULL THEN true ELSE false END AS "isShortlisted"
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN enrollments e ON u.id = e.student_id AND e.deleted = FALSE
      LEFT JOIN cvs cv ON u.id = cv.student_id
      LEFT JOIN evaluations ev ON ev.enrollment_id = e.id
      LEFT JOIN (
        SELECT a.user_id, t.course,
               SUM(a.score)::int       AS marks_scored,
               SUM(a.total_marks)::int AS total_marks
        FROM attempts a
        JOIN tests t ON a.test_id = t.id
        WHERE a.status IN ('submitted', 'expired')
        GROUP BY a.user_id, t.course
      ) ts ON ts.user_id = u.id AND ts.course = e.course
      LEFT JOIN project_submissions ps ON ps.student_id = u.id
      LEFT JOIN recruiter_shortlists rs
        ON rs.student_id = u.id AND rs.recruiter_id = $1 AND rs.course = e.course
      WHERE ${mainWhere}
      ORDER BY u.created_at DESC
      LIMIT $${mainValues.length - 1} OFFSET $${mainValues.length}
    `,
    mainValues,
  );

  return { ...paginatedResult(rows, total, page, limit) };
}

async function countRecruiterDownloads(recruiterId, client = pool) {
  const { rows } = await client.query(
    "SELECT COUNT(*)::int AS total FROM recruiter_download_logs WHERE recruiter_id = $1",
    [recruiterId],
  );
  return Number(rows[0].total || 0);
}

async function insertDownloadLog(recruiterId, studentId, client = pool) {
  const { rows } = await client.query(
    "INSERT INTO recruiter_download_logs (recruiter_id, student_id) VALUES ($1, $2) RETURNING *",
    [recruiterId, studentId],
  );
  return rows[0];
}

async function shortlistExists(payload, client = pool) {
  const { rows } = await client.query(
    `
      SELECT id FROM recruiter_shortlists
      WHERE recruiter_id = $1 AND student_id = $2 AND course = $3
      LIMIT 1
    `,
    [payload.recruiterId, payload.studentId, payload.course],
  );
  return Boolean(rows[0]);
}

async function insertShortlist(payload, client = pool) {
  const { rows } = await client.query(
    "INSERT INTO recruiter_shortlists (recruiter_id, student_id, course) VALUES ($1, $2, $3) RETURNING *",
    [payload.recruiterId, payload.studentId, payload.course],
  );
  return rows[0];
}

async function removeShortlist(recruiterId, studentId, client = pool) {
  const { rows } = await client.query(
    "DELETE FROM recruiter_shortlists WHERE recruiter_id = $1 AND student_id = $2 RETURNING id",
    [recruiterId, studentId],
  );
  return rows[0] || null;
}

async function bulkRemoveShortlist(recruiterId, studentIds, client = pool) {
  const { rowCount } = await client.query(
    "DELETE FROM recruiter_shortlists WHERE recruiter_id = $1 AND student_id = ANY($2::uuid[])",
    [recruiterId, studentIds],
  );
  return rowCount;
}

async function bulkInsertShortlists(recruiterId, items, client = pool) {
  if (!items.length) return 0;
  const values = [];
  const placeholders = items.map((item, i) => {
    const base = i * 3;
    values.push(recruiterId, item.studentId, item.course);
    return `($${base + 1}, $${base + 2}, $${base + 3})`;
  });
  const { rowCount } = await client.query(
    `INSERT INTO recruiter_shortlists (recruiter_id, student_id, course)
     VALUES ${placeholders.join(', ')}
     ON CONFLICT (recruiter_id, student_id, course) DO NOTHING`,
    values,
  );
  return rowCount;
}

async function getRecruiterShortlist(recruiterId, filters = {}, client = pool) {
  const { page, limit, offset } = parsePagination(filters);

  const countResult = await client.query(
    'SELECT COUNT(*)::int AS total FROM recruiter_shortlists WHERE recruiter_id = $1',
    [recruiterId],
  );
  const total = countResult.rows[0].total;

  const { rows } = await client.query(
    `
      SELECT
        rs.id,
        rs.recruiter_id   AS "recruiterId",
        ru.name            AS "recruiterName",
        rs.course,
        u.name             AS "studentName",
        rs.student_id      AS "studentId",
        COALESCE(rs.shortlisted_at, rs.created_at) AS "dateOfShortlist"
      FROM recruiter_shortlists rs
      JOIN users u  ON rs.student_id  = u.id
      JOIN users ru ON rs.recruiter_id = ru.id
      WHERE rs.recruiter_id = $1
      ORDER BY COALESCE(rs.shortlisted_at, rs.created_at) DESC
      LIMIT $2 OFFSET $3
    `,
    [recruiterId, limit, offset],
  );
  return paginatedResult(rows, total, page, limit);
}

async function getAdminRecruiterShortlist(filters = {}, client = pool) {
  const { page, limit, offset } = parsePagination(filters);

  const whereConditions = [];
  const whereValues = [];

  if (filters.recruiter) {
    whereValues.push(filters.recruiter);
    whereConditions.push(`rs.recruiter_id = $${whereValues.length}`);
  }
  if (filters.course) {
    whereValues.push(filters.course);
    whereConditions.push(`rs.course = $${whereValues.length}`);
  }
  if (filters.year) {
    whereValues.push(Number(filters.year));
    whereConditions.push(`EXTRACT(YEAR FROM COALESCE(rs.shortlisted_at, rs.created_at)) = $${whereValues.length}`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countResult = await client.query(
    `SELECT COUNT(*)::int AS total FROM recruiter_shortlists rs ${whereClause}`,
    whereValues,
  );
  const total = countResult.rows[0].total;

  const dataValues = [...whereValues, limit, offset];
  const { rows } = await client.query(
    `
      SELECT
        rs.id,
        rs.recruiter_id   AS "recruiterId",
        ru.name            AS "recruiterName",
        COALESCE(rp.company_name, '') AS "companyName",
        rs.course,
        u.name             AS "studentName",
        rs.student_id      AS "studentId",
        COALESCE(rs.shortlisted_at, rs.created_at) AS "dateOfShortlist"
      FROM recruiter_shortlists rs
      JOIN users u  ON rs.student_id  = u.id
      JOIN users ru ON rs.recruiter_id = ru.id
      LEFT JOIN recruiter_profiles rp ON rs.recruiter_id = rp.user_id
      ${whereClause}
      ORDER BY COALESCE(rs.shortlisted_at, rs.created_at) DESC
      LIMIT $${whereValues.length + 1} OFFSET $${whereValues.length + 2}
    `,
    dataValues,
  );

  // Fetch distinct recruiters and courses for filter dropdowns
  const recruitersResult = await client.query(
    `SELECT DISTINCT rs.recruiter_id AS id, ru.name
     FROM recruiter_shortlists rs
     JOIN users ru ON rs.recruiter_id = ru.id
     ORDER BY ru.name`,
  );
  const coursesResult = await client.query(
    `SELECT DISTINCT course FROM recruiter_shortlists WHERE course IS NOT NULL ORDER BY course`,
  );

  return {
    ...paginatedResult(rows, total, page, limit),
    recruiters: recruitersResult.rows,
    courses: coursesResult.rows.map((r) => r.course),
  };
}

async function getDistinctCities(client = pool) {
  const { rows } = await client.query(
    `SELECT DISTINCT sp.city FROM student_profiles sp
     JOIN users u ON u.id = sp.user_id
     WHERE u.role = 'STUDENT' AND u.is_approved = true AND sp.city IS NOT NULL AND sp.city != ''
     ORDER BY sp.city`
  );
  return rows.map((r) => r.city);
}

async function getDistinctAreas(client = pool) {
  const { rows } = await client.query(
    `SELECT DISTINCT sp.area FROM student_profiles sp
     JOIN users u ON u.id = sp.user_id
     WHERE u.role = 'STUDENT' AND u.is_approved = true AND sp.area IS NOT NULL AND sp.area != ''
     ORDER BY sp.area`
  );
  return rows.map((r) => r.area);
}

async function getDistinctExperienceYears(client = pool) {
  const { rows } = await client.query(
    `SELECT DISTINCT COALESCE(sp.it_exp_years, 0) AS years FROM student_profiles sp
     JOIN users u ON u.id = sp.user_id
     WHERE u.role = 'STUDENT' AND u.is_approved = true
     ORDER BY years`
  );
  return rows.map((r) => r.years);
}

async function createRecruiter(payload, client = pool) {
  const needsTransaction = client === pool;
  const dbClient = needsTransaction ? await pool.connect() : client;

  try {
    if (needsTransaction) await dbClient.query("BEGIN");

    const userQuery = `
      INSERT INTO users (name, email, phone, password_hash, role, is_active, is_approved)
      VALUES ($1, $2, $3, $4, 'RECRUITER', true, true)
      RETURNING id, name, email, phone, role, is_active, is_approved, created_at
    `;
    const { rows: userRows } = await dbClient.query(userQuery, [
      payload.name,
      payload.email,
      payload.phone || null,
      payload.passwordHash,
    ]);
    const user = userRows[0];

    await dbClient.query(
      "INSERT INTO recruiter_profiles (user_id, company_name, designation) VALUES ($1, $2, $3)",
      [user.id, payload.companyName || null, payload.designation || null],
    );

    if (needsTransaction) await dbClient.query("COMMIT");

    return {
      ...user,
      companyName: payload.companyName,
      designation: payload.designation,
    };
  } catch (error) {
    if (needsTransaction) await dbClient.query("ROLLBACK");
    throw error;
  } finally {
    if (needsTransaction) dbClient.release();
  }
}

async function findById(id, client = pool) {
  const { rows } = await client.query(
    `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.is_approved,
             rp.company_name AS "companyName", rp.designation, u.last_login AS "lastLogin"
      FROM users u
      LEFT JOIN recruiter_profiles rp ON u.id = rp.user_id
      WHERE u.id = $1 AND u.role = 'RECRUITER'
    `,
    [id],
  );
  return rows[0] || null;
}

async function listAllRecruiters(filters = {}, client = pool) {
  const { page, limit, offset } = parsePagination(filters);

  const countResult = await client.query(
    "SELECT COUNT(*)::int AS total FROM users WHERE role = 'RECRUITER'",
  );
  const total = countResult.rows[0].total;

  const { rows } = await client.query(
    `
      SELECT u.id, u.name, u.email, u.phone, u.is_active, u.is_approved, u.created_at,
             rp.company_name AS "companyName", rp.designation, u.last_login AS "lastLogin"
      FROM users u
      LEFT JOIN recruiter_profiles rp ON u.id = rp.user_id
      WHERE u.role = 'RECRUITER'
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );
  return paginatedResult(rows, total, page, limit);
}

async function updateRecruiter(id, payload, client = pool) {
  const needsTransaction = client === pool;
  const dbClient = needsTransaction ? await pool.connect() : client;

  try {
    if (needsTransaction) await dbClient.query("BEGIN");

    // Update user fields (name, email, phone)
    const userUpdates = [];
    const userValues = [];
    if (payload.name !== undefined) {
      userValues.push(payload.name);
      userUpdates.push(`name = $${userValues.length}`);
    }
    if (payload.email !== undefined) {
      userValues.push(payload.email);
      userUpdates.push(`email = $${userValues.length}`);
    }
    if (payload.phone !== undefined) {
      userValues.push(payload.phone);
      userUpdates.push(`phone = $${userValues.length}`);
    }
    if (userUpdates.length > 0) {
      userUpdates.push("updated_at = NOW()");
      userValues.push(id);
      await dbClient.query(
        `UPDATE users SET ${userUpdates.join(", ")} WHERE id = $${userValues.length} AND role = 'RECRUITER'`,
        userValues,
      );
    }

    // Update recruiter profile fields (company_name, designation)
    const profileUpdates = [];
    const profileValues = [];
    if (payload.companyName !== undefined) {
      profileValues.push(payload.companyName);
      profileUpdates.push(`company_name = $${profileValues.length}`);
    }
    if (payload.designation !== undefined) {
      profileValues.push(payload.designation);
      profileUpdates.push(`designation = $${profileValues.length}`);
    }
    if (profileUpdates.length > 0) {
      profileValues.push(id);
      await dbClient.query(
        `UPDATE recruiter_profiles SET ${profileUpdates.join(", ")} WHERE user_id = $${profileValues.length}`,
        profileValues,
      );
    }

    if (needsTransaction) await dbClient.query("COMMIT");

    // Return updated recruiter
    return await findById(id, needsTransaction ? pool : client);
  } catch (error) {
    if (needsTransaction) await dbClient.query("ROLLBACK");
    throw error;
  } finally {
    if (needsTransaction) dbClient.release();
  }
}

async function deleteRecruiter(id, client = pool) {
  const { rows } = await client.query(
    "DELETE FROM users WHERE id = $1 AND role = 'RECRUITER' RETURNING id",
    [id],
  );
  return rows[0] || null;
}

export {
  findCandidates,
  countRecruiterDownloads,
  insertDownloadLog,
  shortlistExists,
  insertShortlist,
  removeShortlist,
  bulkRemoveShortlist,
  bulkInsertShortlists,
  getRecruiterShortlist,
  getAdminRecruiterShortlist,
  getDistinctCities,
  getDistinctAreas,
  getDistinctExperienceYears,
  createRecruiter,
  updateRecruiter,
  findById,
  listAllRecruiters,
  deleteRecruiter,
};

export default {
  findCandidates,
  countRecruiterDownloads,
  insertDownloadLog,
  shortlistExists,
  insertShortlist,
  removeShortlist,
  bulkRemoveShortlist,
  bulkInsertShortlists,
  getRecruiterShortlist,
  getAdminRecruiterShortlist,
  getDistinctCities,
  getDistinctAreas,
  getDistinctExperienceYears,
  createRecruiter,
  updateRecruiter,
  findById,
  listAllRecruiters,
  deleteRecruiter,
};
