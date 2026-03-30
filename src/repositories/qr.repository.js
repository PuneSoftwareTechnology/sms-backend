import pool from '../config/db.js';

async function createQr(payload, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO qr_codes (image_url, bank_name, branch, upi_id, account_number, ifsc_code, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING *`,
    [
      payload.imageUrl || null,
      payload.bank_name || null,
      payload.branch || null,
      payload.upi_id || null,
      payload.account_number || null,
      payload.ifsc_code || null,
    ],
  );
  return rows[0];
}

async function listQr(client = pool) {
  const { rows } = await client.query('SELECT * FROM qr_codes ORDER BY created_at DESC');
  return rows;
}

async function deleteQr(id, client = pool) {
  const { rows } = await client.query('DELETE FROM qr_codes WHERE id = $1 RETURNING id', [id]);
  return rows[0] || null;
}

async function deactivateAll(client = pool) {
  await client.query('UPDATE qr_codes SET is_active = false');
}

async function activateById(id, client = pool) {
  const { rows } = await client.query('UPDATE qr_codes SET is_active = true WHERE id = $1 RETURNING *', [id]);
  return rows[0] || null;
}

export { createQr, listQr, deleteQr, deactivateAll, activateById };

export default { createQr, listQr, deleteQr, deactivateAll, activateById };
