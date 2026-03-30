import pool from '../config/db.js';

async function createEmptyProfile(userId, client = pool) {
  const { rows } = await client.query('INSERT INTO student_profiles (user_id) VALUES ($1) RETURNING *', [userId]);
  return rows[0];
}

async function updateProfile(userId, profile, client = pool) {
  const query = `
    UPDATE student_profiles
    SET city = COALESCE($1, city),
        area = COALESCE($2, area),
        graduation = COALESCE($3, graduation),
        graduation_year = COALESCE($4, graduation_year),
        post_graduation = COALESCE($5, post_graduation),
        pg_year = COALESCE($6, pg_year),
        employment_status = COALESCE($7, employment_status),
        last_work_year = COALESCE($8, last_work_year),
        it_exp_years = COALESCE($9, it_exp_years),
        it_exp_months = COALESCE($10, it_exp_months),
        non_it_exp_years = COALESCE($11, non_it_exp_years),
        non_it_exp_months = COALESCE($12, non_it_exp_months),
        certifications = COALESCE($13, certifications),
        updated_at = NOW()
    WHERE user_id = $14
    RETURNING *
  `;

  const values = [
    profile.city ?? null,
    profile.area ?? null,
    profile.graduation ?? null,
    profile.graduationYear ?? null,
    profile.postGraduation ?? null,
    profile.pgYear ?? null,
    profile.employmentStatus ?? null,
    profile.lastWorkedYear ?? null,
    profile.itExperienceYears ?? profile.itExpYears ?? null,
    profile.itExperienceMonths ?? profile.itExpMonths ?? null,
    profile.nonItExperienceYears ?? profile.nonItExpYears ?? null,
    profile.nonItExperienceMonths ?? profile.nonItExpMonths ?? null,
    profile.certifications ? JSON.stringify(profile.certifications) : null,
    userId,
  ];

  const { rows } = await client.query(query, values);
  return rows[0] || null;
}

async function updatePhotoUrl(userId, photoUrl, client = pool) {
  const { rows } = await client.query(
    'UPDATE student_profiles SET photo_url = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
    [photoUrl, userId],
  );
  return rows[0] || null;
}

async function findFullProfile(userId, client = pool) {
  const query = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.is_approved        AS "isApproved",
      sp.city,
      sp.area,
      sp.photo_url         AS "profilePhoto",
      sp.graduation,
      sp.graduation_year   AS "graduationYear",
      sp.post_graduation   AS "postGraduation",
      sp.pg_year           AS "pgYear",
      sp.employment_status AS "employmentStatus",
      sp.last_work_year    AS "lastWorkedYear",
      sp.it_exp_years      AS "itExperienceYears",
      sp.it_exp_months     AS "itExperienceMonths",
      sp.non_it_exp_years  AS "nonItExperienceYears",
      sp.non_it_exp_months AS "nonItExperienceMonths",
      sp.certifications,
      e.enrollment_status  AS "enrollmentStatus",
      e.course,
      e.batch
    FROM users u
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    LEFT JOIN enrollments e ON u.id = e.student_id AND e.deleted = FALSE
    WHERE u.id = $1
    ORDER BY e.created_at DESC
    LIMIT 1
  `;

  const { rows } = await client.query(query, [userId]);
  return rows[0] || null;
}

async function createProjectSubmission(studentId, fileUrl, client = pool) {
  const { rows } = await client.query(
    'INSERT INTO project_submissions (student_id, file_url) VALUES ($1, $2) RETURNING *',
    [studentId, fileUrl],
  );
  return rows[0];
}

async function findCvByStudentId(studentId, client = pool) {
  const { rows } = await client.query('SELECT * FROM cvs WHERE student_id = $1', [studentId]);
  return rows[0] || null;
}

async function upsertCv(studentId, fileUrl, client = pool) {
  const { rows } = await client.query(
    `
      INSERT INTO cvs (student_id, file_url)
      VALUES ($1, $2)
      ON CONFLICT (student_id)
      DO UPDATE SET file_url = EXCLUDED.file_url, updated_at = NOW()
      RETURNING *
    `,
    [studentId, fileUrl],
  );
  return rows[0];
}

async function findEvaluationsByStudentId(studentId, client = pool) {
  const { rows } = await client.query(
    `SELECT
       ev.id,
       ev.enrollment_id    AS "enrollmentId",
       ev.technical_score   AS "technicalScore",
       ev.communication_score AS "communicationScore",
       ev.scope_for_improvement AS "scopeForImprovement",
       ev.trainer_remark    AS "trainerRemark",
       ev.created_at        AS "createdAt",
       ev.updated_at        AS "updatedAt",
       e.course             AS "courseName",
       e.batch
     FROM evaluations ev
     JOIN enrollments e ON ev.enrollment_id = e.id
     WHERE ev.student_id = $1 AND e.deleted = FALSE
     ORDER BY ev.created_at DESC`,
    [studentId],
  );
  return rows;
}

export {
  createEmptyProfile,
  updateProfile,
  updatePhotoUrl,
  findFullProfile,
  createProjectSubmission,
  findCvByStudentId,
  upsertCv,
  findEvaluationsByStudentId,
};

export default {
  createEmptyProfile,
  updateProfile,
  updatePhotoUrl,
  findFullProfile,
  createProjectSubmission,
  findCvByStudentId,
  upsertCv,
  findEvaluationsByStudentId,
};
