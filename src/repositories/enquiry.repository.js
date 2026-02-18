import pool from '../config/db.js';
async function updateLeadStatus(enquiryId, status, client = pool) {
  const query = `
    UPDATE enquiries
    SET lead_status = $1,
        updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  const { rows } = await client.query(query, [status, enquiryId]);
  return rows[0] || null;
}

export {
updateLeadStatus,
};

export default {
updateLeadStatus,
};
