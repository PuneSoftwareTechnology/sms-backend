import pool from "../config/db.js";

async function createEnquiry(payload, client = pool) {
  const { rows } = await client.query(
    `
      INSERT INTO enquiries (enquiry_date, name, phone, email, course, institute, lead_status, demo_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      payload.enquiryDate || new Date().toISOString().slice(0, 10),
      payload.name,
      payload.phone,
      payload.email || null,
      payload.course || null,
      payload.institute || null,
      payload.leadStatus || "PROSPECTIVE",
      payload.demoStatus || "PENDING",
    ],
  );
  return rows[0];
}

async function listEnquiries(filters = {}, client = pool) {
  const values = [];
  const conditions = ["1=1"];

  if (filters.fromDate) {
    values.push(filters.fromDate);
    conditions.push(`created_at::date >= $${values.length}`);
  }
  if (filters.toDate) {
    values.push(filters.toDate);
    conditions.push(`created_at::date <= $${values.length}`);
  }
  if (filters.leadStatus) {
    values.push(filters.leadStatus);
    conditions.push(`lead_status = $${values.length}`);
  }
  if (filters.demoStatus) {
    values.push(filters.demoStatus);
    conditions.push(`demo_status = $${values.length}`);
  }

  const { rows } = await client.query(
    `SELECT * FROM enquiries WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`,
    values,
  );
  return rows;
}

async function updateEnquiry(id, payload, client = pool) {
  const { rows } = await client.query(
    `
      UPDATE enquiries
      SET enquiry_date = $1,
          name = $2,
          phone = $3,
          email = $4,
          course = $5,
          institute = $6,
          lead_status = $7,
          demo_status = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `,
    [
      payload.enquiryDate || new Date().toISOString().slice(0, 10),
      payload.name,
      payload.phone,
      payload.email || null,
      payload.course || null,
      payload.institute || null,
      payload.leadStatus,
      payload.demoStatus,
      id,
    ],
  );
  return rows[0] || null;
}

async function deleteEnquiry(id, client = pool) {
  const { rows } = await client.query(
    "DELETE FROM enquiries WHERE id = $1 RETURNING id",
    [id],
  );
  return rows[0] || null;
}

async function updateLeadStatus(enquiryId, status, client = pool) {
  const { rows } = await client.query(
    `
      UPDATE enquiries
      SET lead_status = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `,
    [status, enquiryId],
  );
  return rows[0] || null;
}

export {
  createEnquiry,
  listEnquiries,
  updateEnquiry,
  deleteEnquiry,
  updateLeadStatus,
};

export default {
  createEnquiry,
  listEnquiries,
  updateEnquiry,
  deleteEnquiry,
  updateLeadStatus,
};
