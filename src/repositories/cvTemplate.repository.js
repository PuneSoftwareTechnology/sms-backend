import pool from '../config/db.js';

async function findAll(client = pool) {
  const { rows } = await client.query(
    `SELECT id, title, course, experience_level, file_url, original_filename, uploaded_by, created_at, updated_at
     FROM cv_templates
     ORDER BY course, experience_level, created_at DESC`,
  );
  return rows;
}

async function findByCourses(courses, client = pool) {
  if (!courses?.length) return [];
  const { rows } = await client.query(
    `SELECT id, title, course, experience_level, file_url, original_filename, created_at
     FROM cv_templates
     WHERE course = ANY($1)
     ORDER BY course, experience_level, created_at DESC`,
    [courses],
  );
  return rows;
}

async function findById(id, client = pool) {
  const { rows } = await client.query(
    'SELECT * FROM cv_templates WHERE id = $1',
    [id],
  );
  return rows[0] || null;
}

async function create({ title, course, experienceLevel, fileUrl, originalFilename, uploadedBy }, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO cv_templates (title, course, experience_level, file_url, original_filename, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, course, experienceLevel, fileUrl, originalFilename, uploadedBy],
  );
  return rows[0];
}

async function deleteById(id, client = pool) {
  const { rows } = await client.query(
    'DELETE FROM cv_templates WHERE id = $1 RETURNING *',
    [id],
  );
  return rows[0] || null;
}

export { findAll, findByCourses, findById, create, deleteById };
export default { findAll, findByCourses, findById, create, deleteById };
