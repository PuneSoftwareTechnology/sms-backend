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

async function findProfilePhotoKey(userId, client = pool) {
  const { rows } = await client.query(
    'SELECT photo_url FROM student_profiles WHERE user_id = $1',
    [userId],
  );
  return rows[0]?.photo_url || null;
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

async function findProjectSubmissionsByStudentId(studentId, client = pool) {
  const { rows } = await client.query(
    `SELECT id, file_url AS "fileUrl", created_at AS "createdAt"
     FROM project_submissions WHERE student_id = $1 ORDER BY created_at DESC`,
    [studentId],
  );
  return rows;
}

async function deleteProjectSubmission(projectId, studentId, client = pool) {
  const { rows } = await client.query(
    'DELETE FROM project_submissions WHERE id = $1 AND student_id = $2 RETURNING file_url AS "fileUrl"',
    [projectId, studentId],
  );
  return rows[0] || null;
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

async function updateCommunicationScore(evaluationId, communicationScore, client = pool) {
  return updateEvaluation(evaluationId, { communicationScore }, client);
}

async function updateEvaluation(evaluationId, data, client = pool) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (data.communicationScore !== undefined) {
    fields.push(`communication_score = $${idx++}`);
    values.push(data.communicationScore);
  }
  if (data.scopeForImprovement !== undefined) {
    fields.push(`scope_for_improvement = $${idx++}`);
    values.push(data.scopeForImprovement);
  }
  if (data.trainerRemark !== undefined) {
    fields.push(`trainer_remark = $${idx++}`);
    values.push(data.trainerRemark);
  }

  if (fields.length === 0) return null;

  fields.push('updated_at = NOW()');
  values.push(evaluationId);

  const { rows } = await client.query(
    `UPDATE evaluations
     SET ${fields.join(', ')}
     WHERE id = $${idx}
     RETURNING
       id,
       enrollment_id    AS "enrollmentId",
       student_id       AS "studentId",
       technical_score   AS "technicalScore",
       communication_score AS "communicationScore",
       scope_for_improvement AS "scopeForImprovement",
       trainer_remark    AS "trainerRemark",
       updated_at        AS "updatedAt"`,
    values,
  );
  return rows[0] || null;
}

async function findEvaluationsByStudentId(studentId, client = pool) {
  const { rows } = await client.query(
    `SELECT
       ev.id,
       ev.enrollment_id    AS "enrollmentId",
       COALESCE(ts.marks_scored, 0)::int AS "technicalMarksScored",
       COALESCE(ts.total_marks, 0)::int  AS "technicalTotalMarks",
       ev.communication_score AS "communicationScore",
       ev.scope_for_improvement AS "scopeForImprovement",
       ev.trainer_remark    AS "trainerRemark",
       ev.created_at        AS "createdAt",
       ev.updated_at        AS "updatedAt",
       e.course             AS "courseName",
       e.batch
     FROM evaluations ev
     JOIN enrollments e ON ev.enrollment_id = e.id
     LEFT JOIN (
       SELECT a.user_id, t.course,
              SUM(a.score)::int       AS marks_scored,
              SUM(a.total_marks)::int AS total_marks
       FROM attempts a
       JOIN tests t ON a.test_id = t.id
       WHERE a.status IN ('submitted', 'expired') AND a.reset_at IS NULL
       GROUP BY a.user_id, t.course
     ) ts ON ts.user_id = ev.student_id AND ts.course = e.course
     WHERE ev.student_id = $1 AND e.deleted = FALSE
     ORDER BY ev.created_at DESC`,
    [studentId],
  );
  return rows;
}

async function findTestScoresByStudentId(studentId, client = pool) {
  const { rows } = await client.query(
    `SELECT
       a.test_id   AS "testId",
       t.title      AS "testName",
       t.course,
       a.score,
       a.total_marks AS "totalMarks",
       a.submitted_at AS "submittedAt",
       (
         SELECT COUNT(*)::int
         FROM attempts a2
         WHERE a2.user_id = a.user_id
           AND a2.test_id = a.test_id
           AND a2.status IN ('submitted', 'expired')
       ) AS "attemptCount"
     FROM attempts a
     JOIN tests t ON a.test_id = t.id
     WHERE a.user_id = $1 AND a.status IN ('submitted', 'expired') AND a.reset_at IS NULL
     ORDER BY t.course, a.submitted_at ASC`,
    [studentId],
  );
  return rows;
}

export {
  createEmptyProfile,
  updateProfile,
  updatePhotoUrl,
  findProfilePhotoKey,
  findFullProfile,
  createProjectSubmission,
  findProjectSubmissionsByStudentId,
  deleteProjectSubmission,
  findCvByStudentId,
  upsertCv,
  findEvaluationsByStudentId,
  findTestScoresByStudentId,
  updateCommunicationScore,
  updateEvaluation,
};

export default {
  createEmptyProfile,
  updateProfile,
  updatePhotoUrl,
  findProfilePhotoKey,
  findFullProfile,
  createProjectSubmission,
  findProjectSubmissionsByStudentId,
  deleteProjectSubmission,
  findCvByStudentId,
  upsertCv,
  findEvaluationsByStudentId,
  findTestScoresByStudentId,
  updateCommunicationScore,
  updateEvaluation,
};
