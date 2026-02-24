import pool from "../config/db.js";

async function findByEmail(email, client = pool) {
  const query = `
    SELECT id, name, email, password_hash, role, is_active, is_approved, is_email_verified, phone, last_login
    FROM users
    WHERE email = $1
  `;
  const { rows } = await client.query(query, [email]);
  return rows[0] || null;
}

async function findById(id, client = pool) {
  const query = `
    SELECT id, name, email, role, is_active, is_approved, is_email_verified, phone, last_login
    FROM users
    WHERE id = $1
  `;
  const { rows } = await client.query(query, [id]);
  return rows[0] || null;
}

async function createUser(payload, client = pool) {
  const query = `
    INSERT INTO users (name, email, phone, password_hash, role, is_active, is_approved, is_email_verified)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, name, email, phone, role, is_active, is_approved, is_email_verified
  `;
  const values = [
    payload.name,
    payload.email,
    payload.phone || null,
    payload.passwordHash,
    payload.role,
    payload.isActive ?? true,
    payload.isApproved ?? false,
    payload.isEmailVerified ?? false,
  ];

  const { rows } = await client.query(query, values);
  return rows[0];
}

async function updateLastLogin(id, client = pool) {
  await client.query("UPDATE users SET last_login = NOW() WHERE id = $1", [id]);
}

async function setEmailVerified(id, client = pool) {
  const { rows } = await client.query(
    "UPDATE users SET is_email_verified = true, updated_at = NOW() WHERE id = $1 RETURNING id, email, is_email_verified",
    [id],
  );
  return rows[0] || null;
}

async function updatePasswordHash(id, passwordHash, client = pool) {
  await client.query(
    "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
    [passwordHash, id],
  );
}

async function approveStudent(id, client = pool) {
  const { rows } = await client.query(
    `
      UPDATE users
      SET is_approved = true,
          updated_at = NOW()
      WHERE id = $1 AND role = 'STUDENT'
      RETURNING id, name, email, role, is_approved
    `,
    [id],
  );
  return rows[0] || null;
}

async function deleteUserByRole(id, role, client = pool) {
  const { rows } = await client.query(
    "DELETE FROM users WHERE id = $1 AND role = $2 RETURNING id",
    [id, role],
  );
  return rows[0] || null;
}

async function listUsersByRole(role, client = pool) {
  const query = `
    SELECT id, name, email, phone, role, is_active, is_approved, is_email_verified, last_login, created_at
    FROM users
    WHERE role = $1
    ORDER BY created_at DESC
  `;
  const { rows } = await client.query(query, [role]);
  return rows;
}

async function deactivateInactiveRecruiters(client = pool) {
  const { rowCount } = await client.query(`
    UPDATE users
    SET is_active = false
    WHERE role = 'RECRUITER'
      AND last_login < NOW() - INTERVAL '6 months'
  `);
  return rowCount;
}

export {
  findByEmail,
  findById,
  createUser,
  updateLastLogin,
  setEmailVerified,
  updatePasswordHash,
  approveStudent,
  deleteUserByRole,
  deactivateInactiveRecruiters,
  listUsersByRole,
};

export default {
  findByEmail,
  findById,
  createUser,
  updateLastLogin,
  setEmailVerified,
  updatePasswordHash,
  approveStudent,
  deleteUserByRole,
  deactivateInactiveRecruiters,
  listUsersByRole,
};
