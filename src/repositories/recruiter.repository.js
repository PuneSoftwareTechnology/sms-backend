import pool from '../config/db.js';
async function findCandidates(filters = {}, client = pool) {
  const values = [];
  const conditions = ["u.role = 'STUDENT'", 'u.is_approved = true'];

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

  const query = `
    SELECT
      u.id,
      u.name,
      sp.city,
      e.course,
      sp.it_exp_years,
      cv.file_url
    FROM users u
    JOIN student_profiles sp ON u.id = sp.user_id
    JOIN enrollments e ON u.id = e.student_id
    LEFT JOIN cvs cv ON u.id = cv.student_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY u.id DESC
  `;

  const { rows } = await client.query(query, values);
  return rows;
}

async function countRecruiterDownloads(recruiterId, client = pool) {
  const query = `
    SELECT COUNT(*)::int AS total
    FROM recruiter_download_logs
    WHERE recruiter_id = $1
  `;
  const { rows } = await client.query(query, [recruiterId]);
  return Number(rows[0].total || 0);
}

async function insertDownloadLog(recruiterId, studentId, client = pool) {
  const query = `
    INSERT INTO recruiter_download_logs (recruiter_id, student_id)
    VALUES ($1, $2)
    RETURNING *
  `;

  const { rows } = await client.query(query, [recruiterId, studentId]);
  return rows[0];
}

async function insertShortlist(payload, client = pool) {
  const query = `
    INSERT INTO recruiter_shortlists (recruiter_id, student_id, course)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const { rows } = await client.query(query, [payload.recruiterId, payload.studentId, payload.course]);
  return rows[0];
}

export {
findCandidates,
  countRecruiterDownloads,
  insertDownloadLog,
  insertShortlist,
};

export default {
findCandidates,
  countRecruiterDownloads,
  insertDownloadLog,
  insertShortlist,
};
