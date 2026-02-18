import pool from '../config/db.js';
async function createVerificationToken(userId, token, client = pool) {
  const query = `
    INSERT INTO verification_tokens (user_id, token)
    VALUES ($1, $2)
    RETURNING *
  `;
  const { rows } = await client.query(query, [userId, token]);
  return rows[0];
}

export {
createVerificationToken,
};

export default {
createVerificationToken,
};
