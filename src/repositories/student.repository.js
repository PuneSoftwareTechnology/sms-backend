import pool from '../config/db.js';

async function createEmptyProfile(userId, client = pool) {
  const { rows } = await client.query('INSERT INTO student_profiles (user_id) VALUES ($1) RETURNING *', [userId]);
  return rows[0];
}

async function updateProfile(userId, profile, client = pool) {
  const query = `
    UPDATE student_profiles
    SET city = $1,
        area = $2,
        graduation = $3,
        post_graduation = $4,
        employment_status = $5,
        it_exp_years = $6,
        updated_at = NOW()
    WHERE user_id = $7
    RETURNING *
  `;

  const values = [
    profile.city,
    profile.area,
    profile.graduation,
    profile.postGraduation,
    profile.employmentStatus,
    profile.itExpYears,
    userId,
  ];

  const { rows } = await client.query(query, values);
  return rows[0] || null;
}

async function findFullProfile(userId, client = pool) {
  const query = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.is_approved,
      sp.city,
      sp.area,
      sp.graduation,
      sp.post_graduation,
      sp.employment_status,
      sp.it_exp_years
    FROM users u
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    WHERE u.id = $1
  `;

  const { rows } = await client.query(query, [userId]);
  return rows[0] || null;
}

async function createCertification(payload, client = pool) {
  const { rows } = await client.query(
    `
      INSERT INTO certifications (student_id, title, issuer, issue_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [payload.studentId, payload.title, payload.issuer || null, payload.issueDate || null],
  );
  return rows[0];
}

async function deleteCertification(certificationId, studentId, client = pool) {
  const { rows } = await client.query(
    'DELETE FROM certifications WHERE id = $1 AND student_id = $2 RETURNING id',
    [certificationId, studentId],
  );
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

export {
  createEmptyProfile,
  updateProfile,
  findFullProfile,
  createCertification,
  deleteCertification,
  createProjectSubmission,
  findCvByStudentId,
  upsertCv,
};

export default {
  createEmptyProfile,
  updateProfile,
  findFullProfile,
  createCertification,
  deleteCertification,
  createProjectSubmission,
  findCvByStudentId,
  upsertCv,
};
