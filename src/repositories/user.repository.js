import pool from '../config/db.js';
async function findByEmail(email, client = pool) {
  const query = `
    SELECT id, name, email, password_hash, role, is_active, is_approved, phone, last_login
    FROM users
    WHERE email = $1
  `;
  const { rows } = await client.query(query, [email]);
  return rows[0] || null;
}

async function findById(id, client = pool) {
  const query = `
    SELECT id, name, email, role, is_active, is_approved, phone, last_login
    FROM users
    WHERE id = $1
  `;
  const { rows } = await client.query(query, [id]);
  return rows[0] || null;
}

async function createUser(payload, client = pool) {
  const query = `
    INSERT INTO users (name, email, phone, password_hash, role, is_active, is_approved)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, email, phone, role, is_active, is_approved
  `;
  const values = [
    payload.name,
    payload.email,
    payload.phone || null,
    payload.passwordHash,
    payload.role,
    payload.isActive ?? true,
    payload.isApproved ?? false,
  ];

  const { rows } = await client.query(query, values);
  return rows[0];
}

async function updateLastLogin(id, client = pool) {
  const query = `
    UPDATE users
    SET last_login = NOW()
    WHERE id = $1
  `;
  await client.query(query, [id]);
}

async function deactivateInactiveRecruiters(client = pool) {
  const query = `
    UPDATE users
    SET is_active = false
    WHERE role = 'RECRUITER'
      AND last_login < NOW() - INTERVAL '6 months'
    RETURNING id
  `;

  const { rowCount } = await client.query(query);
  return rowCount;
}

export {
findByEmail,
  findById,
  createUser,
  updateLastLogin,
  deactivateInactiveRecruiters,
};

export default {
findByEmail,
  findById,
  createUser,
  updateLastLogin,
  deactivateInactiveRecruiters,
};
