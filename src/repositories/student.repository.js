import pool from '../config/db.js';
async function createEmptyProfile(userId, client = pool) {
  const query = `
    INSERT INTO student_profiles (user_id)
    VALUES ($1)
    RETURNING *
  `;
  const { rows } = await client.query(query, [userId]);
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

export {
createEmptyProfile,
  updateProfile,
  findFullProfile,
};

export default {
createEmptyProfile,
  updateProfile,
  findFullProfile,
};
