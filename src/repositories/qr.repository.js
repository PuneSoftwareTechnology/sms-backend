import pool from '../config/db.js';
async function deactivateAll(client = pool) {
  await client.query('UPDATE qr_codes SET is_active = false');
}

async function activateById(id, client = pool) {
  const { rows } = await client.query(
    'UPDATE qr_codes SET is_active = true WHERE id = $1 RETURNING *',
    [id],
  );
  return rows[0] || null;
}

export {
deactivateAll,
  activateById,
};

export default {
deactivateAll,
  activateById,
};
