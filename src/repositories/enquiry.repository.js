import pool from "../config/db.js";

async function createEnquiry(payload, client = pool) {
  const demoStatus = payload.demoStatus || "PENDING";
  const demoDate =
    payload.demoDate ||
    (demoStatus === "DONE" ? new Date().toISOString().slice(0, 10) : null);

  const { rows } = await client.query(
    `
      INSERT INTO enquiries (enquiry_date, name, phone, email, course, institute, lead_status, demo_status, demo_date, comment)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      demoStatus,
      demoDate,
      payload.comment || null,
    ],
  );
  return rows[0];
}

async function listEnquiries(filters = {}, client = pool) {
  const values = [];
  const conditions = ["1=1"];

  if (filters.fromDate) {
    values.push(filters.fromDate);
    conditions.push(`enquiry_date >= $${values.length}`);
  }
  if (filters.toDate) {
    values.push(filters.toDate);
    conditions.push(`enquiry_date <= $${values.length}`);
  }
  if (filters.leadStatus) {
    values.push(filters.leadStatus);
    conditions.push(`lead_status = $${values.length}`);
  }
  if (filters.demoStatus) {
    values.push(filters.demoStatus);
    conditions.push(`demo_status = $${values.length}`);
  }
  if (filters.institute) {
    values.push(filters.institute);
    conditions.push(`institute = $${values.length}`);
  }
  if (filters.course) {
    values.push(filters.course);
    conditions.push(`course = $${values.length}`);
  }

  const where = conditions.join(" AND ");

  const coursesResult = await client.query(
    `SELECT DISTINCT course FROM enquiries WHERE course IS NOT NULL AND course <> '' ORDER BY course`,
  );
  const courses = coursesResult.rows.map((r) => r.course);

  const countResult = await client.query(
    `SELECT COUNT(*) FROM enquiries WHERE ${where}`,
    values,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const hasPagination =
    filters.limit !== undefined || filters.page !== undefined;

  let rows;
  let page = 1;
  let limit = total;

  if (hasPagination) {
    page = Math.max(1, parseInt(filters.page, 10) || 1);
    limit = Math.max(1, parseInt(filters.limit, 10) || 50);
    const offset = (page - 1) * limit;

    values.push(limit);
    values.push(offset);

    ({ rows } = await client.query(
      `SELECT * FROM enquiries WHERE ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    ));
  } else {
    ({ rows } = await client.query(
      `SELECT * FROM enquiries WHERE ${where} ORDER BY created_at DESC`,
      values,
    ));
  }

  return {
    items: rows,
    total,
    page,
    totalPages: hasPagination ? Math.ceil(total / limit) : 1,
    courses,
  };
}

async function findById(id, client = pool) {
  const { rows } = await client.query(
    "SELECT * FROM enquiries WHERE id = $1",
    [id],
  );
  return rows[0] || null;
}

async function findContactsByIds(ids, client = pool) {
  if (!ids?.length) return [];
  const { rows } = await client.query(
    `SELECT id, name, email, institute FROM enquiries WHERE id = ANY($1) AND email IS NOT NULL AND email <> ''`,
    [ids],
  );
  return rows;
}

async function updateEnquiry(id, payload, client = pool) {
  let demoDate = payload.demoDate || null;
  if (!demoDate && payload.demoStatus === "DONE") {
    const existing = await client.query(
      "SELECT demo_date FROM enquiries WHERE id = $1",
      [id],
    );
    demoDate =
      existing.rows[0]?.demo_date ?? new Date().toISOString().slice(0, 10);
  }

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
          demo_date = $9,
          comment = $10,
          updated_at = NOW()
      WHERE id = $11
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
      demoDate,
      payload.comment || null,
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
  findById,
  findContactsByIds,
};

export default {
  createEnquiry,
  listEnquiries,
  updateEnquiry,
  deleteEnquiry,
  updateLeadStatus,
  findById,
  findContactsByIds,
};
