import pool from "../config/db.js";

async function findCandidates(filters = {}, client = pool) {
  const values = [];
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
      SELECT u.id, u.name, sp.city, e.course, sp.it_exp_years, cv.file_url
      FROM users u
      JOIN student_profiles sp ON u.id = sp.user_id
      JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN cvs cv ON u.id = cv.student_id
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
  createRecruiter,
  findById,
  listAllRecruiters,
  deleteRecruiter,
};
