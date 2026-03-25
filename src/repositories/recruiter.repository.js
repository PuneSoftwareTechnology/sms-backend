import pool from "../config/db.js";

async function findCandidates(filters = {}, recruiterId, client = pool) {
  const values = [recruiterId];
  const conditions = ["u.role = 'STUDENT'", "u.is_approved = true"];

  if (filters.city) {
    values.push(filters.city);
    conditions.push(`sp.city = $${values.length}`);
  }
  if (filters.course) {
    values.push(filters.course);
    conditions.push(`e.course = $${values.length}`);
  }
  if (filters.minExperience !== undefined) {
    values.push(filters.minExperience);
    conditions.push(`sp.it_exp_years >= $${values.length}`);
  }

  const { rows } = await client.query(
    `
      SELECT
        u.id,
        u.name,
        sp.city,
        e.course,
        COALESCE(sp.it_exp_years, 0)  AS "itExperienceYears",
        COALESCE(sp.it_exp_months, 0) AS "itExperienceMonths",
        cv.file_url                   AS "cvUrl",
        CASE WHEN rs.id IS NOT NULL THEN true ELSE false END AS "isShortlisted"
      FROM users u
      JOIN student_profiles sp ON u.id = sp.user_id
      JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN cvs cv ON u.id = cv.student_id
      LEFT JOIN recruiter_shortlists rs
        ON rs.student_id = u.id AND rs.recruiter_id = $1 AND rs.course = e.course
      WHERE ${conditions.join(" AND ")}
      ORDER BY u.created_at DESC
    `,
    values,
  );

  return rows;
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

async function getRecruiterShortlist(recruiterId, client = pool) {
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
    `,
    [recruiterId],
  );
  return rows;
}

async function getAdminRecruiterShortlist(client = pool) {
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
      ORDER BY COALESCE(rs.shortlisted_at, rs.created_at) DESC
    `,
  );
  return rows;
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
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.is_approved, rp.company_name, rp.designation 
      FROM users u
      LEFT JOIN recruiter_profiles rp ON u.id = rp.user_id
      WHERE u.id = $1 AND u.role = 'RECRUITER'
    `,
    [id],
  );
  return rows[0] || null;
}

async function listAllRecruiters(client = pool) {
  const { rows } = await client.query(
    `
      SELECT u.id, u.name, u.email, u.phone, u.is_active, u.is_approved, u.created_at, rp.company_name, rp.designation 
      FROM users u
      LEFT JOIN recruiter_profiles rp ON u.id = rp.user_id
      WHERE u.role = 'RECRUITER'
      ORDER BY u.created_at DESC
    `,
  );
  return rows;
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
  getRecruiterShortlist,
  getAdminRecruiterShortlist,
  getDistinctCities,
  getDistinctExperienceYears,
  createRecruiter,
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
  getRecruiterShortlist,
  getAdminRecruiterShortlist,
  getDistinctCities,
  getDistinctExperienceYears,
  createRecruiter,
  findById,
  listAllRecruiters,
  deleteRecruiter,
};
