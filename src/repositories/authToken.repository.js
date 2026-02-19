import pool from '../config/db.js';

async function createEmailVerification(userId, token, expiresAt, client = pool) {
  const { rows } = await client.query(
    `
      INSERT INTO email_verifications (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [userId, token, expiresAt],
  );
  return rows[0];
}

async function findValidEmailVerification(token, client = pool) {
  const { rows } = await client.query(
    `
      SELECT *
      FROM email_verifications
      WHERE token = $1
        AND used = false
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [token],
  );
  return rows[0] || null;
}

async function markEmailVerificationUsed(id, client = pool) {
  await client.query('UPDATE email_verifications SET used = true WHERE id = $1', [id]);
}

async function createPasswordReset(userId, token, expiresAt, client = pool) {
  const { rows } = await client.query(
    `
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [userId, token, expiresAt],
  );
  return rows[0];
}

async function findValidPasswordReset(token, client = pool) {
  const { rows } = await client.query(
    `
      SELECT *
      FROM password_resets
      WHERE token = $1
        AND used = false
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [token],
  );
  return rows[0] || null;
}

async function markPasswordResetUsed(id, client = pool) {
  await client.query('UPDATE password_resets SET used = true WHERE id = $1', [id]);
}

async function blacklistToken(token, expiresAt, client = pool) {
  await client.query(
    `
      INSERT INTO token_blacklist (token, expires_at)
      VALUES ($1, $2)
      ON CONFLICT (token) DO NOTHING
    `,
    [token, expiresAt],
  );
}

async function isTokenBlacklisted(token, client = pool) {
  const { rows } = await client.query(
    `
      SELECT id
      FROM token_blacklist
      WHERE token = $1
        AND expires_at > NOW()
      LIMIT 1
    `,
    [token],
  );
  return Boolean(rows[0]);
}

export {
  createEmailVerification,
  findValidEmailVerification,
  markEmailVerificationUsed,
  createPasswordReset,
  findValidPasswordReset,
  markPasswordResetUsed,
  blacklistToken,
  isTokenBlacklisted,
};

export default {
  createEmailVerification,
  findValidEmailVerification,
  markEmailVerificationUsed,
  createPasswordReset,
  findValidPasswordReset,
  markPasswordResetUsed,
  blacklistToken,
  isTokenBlacklisted,
};
