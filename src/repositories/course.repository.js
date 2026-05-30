import pool from "../config/db.js";

async function createCourse(payload, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO courses (name, is_active, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [payload.name, payload.isActive ?? true, payload.createdBy || null],
  );
  return rows[0];
}

async function listCourses(filters = {}, client = pool) {
  const values = [];
  const conditions = ["1=1"];

  if (filters.isActive !== undefined) {
    values.push(filters.isActive);
    conditions.push(`is_active = $${values.length}`);
  }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`name ILIKE $${values.length}`);
  }

  const where = conditions.join(" AND ");
  const { rows } = await client.query(
    `SELECT * FROM courses WHERE ${where} ORDER BY name ASC`,
    values,
  );
  return rows;
}

async function findCourseById(id, client = pool) {
  const { rows } = await client.query("SELECT * FROM courses WHERE id = $1", [
    id,
  ]);
  return rows[0] || null;
}

async function findCourseByName(name, client = pool) {
  const { rows } = await client.query(
    "SELECT * FROM courses WHERE LOWER(name) = LOWER($1)",
    [name],
  );
  return rows[0] || null;
}

async function updateCourse(id, payload, client = pool) {
  const { rows } = await client.query(
    `UPDATE courses
        SET name = COALESCE($1, name),
            is_active = COALESCE($2, is_active),
            updated_at = NOW()
      WHERE id = $3
      RETURNING *`,
    [payload.name ?? null, payload.isActive ?? null, id],
  );
  return rows[0] || null;
}

async function deleteCourse(id, client = pool) {
  const { rows } = await client.query(
    "DELETE FROM courses WHERE id = $1 RETURNING id",
    [id],
  );
  return rows[0] || null;
}

export {
  createCourse,
  listCourses,
  findCourseById,
  findCourseByName,
  updateCourse,
  deleteCourse,
};

export default {
  createCourse,
  listCourses,
  findCourseById,
  findCourseByName,
  updateCourse,
  deleteCourse,
};
