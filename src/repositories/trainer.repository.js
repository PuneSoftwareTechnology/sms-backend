import pool from "../config/db.js";

/**
 * trim + collapse internal whitespace + lowercase. Trainers are matched on this
 * key when looking for duplicates, so "Rahul  Sharma" and "rahul sharma" are
 * recognised as the same spelling. It deliberately does NOT try to decide that
 * "Rahul S" is the same person — that is what the merge action is for.
 */
const NORM = (col) => `LOWER(REGEXP_REPLACE(TRIM(${col}), '\\s+', ' ', 'g'))`;

const TRAINER_COLUMNS = `
  id            AS "id",
  trainer_code  AS "code",
  name          AS "name",
  courses       AS "courses",
  note          AS "note",
  is_active     AS "isActive",
  created_at    AS "createdAt"
`;

// ─── Trainers ────────────────────────────────────────────────────────────────

async function createTrainer(payload, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO trainers (name, courses, note, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING ${TRAINER_COLUMNS}`,
    [
      payload.name,
      payload.courses ?? [],
      payload.note || null,
      payload.isActive ?? true,
    ],
  );
  return rows[0];
}

async function listTrainers(filters = {}, client = pool) {
  const values = [];
  const conditions = ["1=1"];

  if (filters.isActive !== undefined) {
    values.push(filters.isActive);
    conditions.push(`is_active = $${values.length}`);
  }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(
      `(name ILIKE $${values.length} OR trainer_code ILIKE $${values.length})`,
    );
  }
  if (filters.course) {
    values.push(filters.course);
    conditions.push(`$${values.length} = ANY(courses)`);
  }

  const { rows } = await client.query(
    `SELECT ${TRAINER_COLUMNS}
       FROM trainers
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${NORM("name")} ASC, trainer_code ASC`,
    values,
  );
  return rows;
}

/**
 * Trainers with counts attached — drives the Trainers management page, where
 * the enrollment count is what tells you whether a trainer is safe to delete.
 */
async function listTrainersWithStats(filters = {}, client = pool) {
  const values = [];
  const conditions = ["1=1"];

  if (filters.isActive !== undefined) {
    values.push(filters.isActive);
    conditions.push(`t.is_active = $${values.length}`);
  }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(
      `(t.name ILIKE $${values.length} OR t.trainer_code ILIKE $${values.length})`,
    );
  }

  const { rows } = await client.query(
    `SELECT
       t.id            AS "id",
       t.trainer_code  AS "code",
       t.name          AS "name",
       t.courses       AS "courses",
       t.note          AS "note",
       t.is_active     AS "isActive",
       t.created_at    AS "createdAt",
       COUNT(e.id)::int AS "enrollmentCount",
       ARRAY_REMOVE(ARRAY_AGG(DISTINCT e.course), NULL) AS "teachingCourses"
     FROM trainers t
     LEFT JOIN enrollments e
            ON e.trainer_id = t.id AND e.deleted = FALSE
     WHERE ${conditions.join(" AND ")}
     GROUP BY t.id
     ORDER BY ${NORM("t.name")} ASC, t.trainer_code ASC`,
    values,
  );
  return rows;
}

async function findTrainerById(id, client = pool) {
  const { rows } = await client.query(
    `SELECT ${TRAINER_COLUMNS} FROM trainers WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

/** Same-spelling trainers, used to warn before creating an accidental duplicate. */
async function findTrainersByName(name, client = pool) {
  const { rows } = await client.query(
    `SELECT ${TRAINER_COLUMNS} FROM trainers WHERE ${NORM("name")} = ${NORM("$1")}`,
    [name],
  );
  return rows;
}

async function updateTrainer(id, payload, client = pool) {
  const fields = [];
  const values = [];

  const push = (column, value) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (payload.name !== undefined) push("name", payload.name);
  if (payload.courses !== undefined) push("courses", payload.courses);
  if (payload.note !== undefined) push("note", payload.note || null);
  if (payload.isActive !== undefined) push("is_active", payload.isActive);

  if (fields.length === 0) return findTrainerById(id, client);

  values.push(id);
  const { rows } = await client.query(
    `UPDATE trainers SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING ${TRAINER_COLUMNS}`,
    values,
  );
  return rows[0] || null;
}

async function deleteTrainer(id, client = pool) {
  const { rows } = await client.query(
    "DELETE FROM trainers WHERE id = $1 RETURNING id",
    [id],
  );
  return rows[0] || null;
}

async function countTrainerEnrollments(id, client = pool) {
  const { rows } = await client.query(
    "SELECT COUNT(*)::int AS count FROM enrollments WHERE trainer_id = $1 AND deleted = FALSE",
    [id],
  );
  return rows[0].count;
}

/**
 * Repoints every enrollment and payout from `loserIds` onto `survivorId`, unions
 * their course tags, and deletes the losers. Caller supplies a transaction
 * client — this touches three tables and must not half-apply.
 */
async function mergeTrainers(survivorId, loserIds, client) {
  const survivor = await findTrainerById(survivorId, client);

  // Course tags are a union: merging must not silently drop a course the
  // absorbed record was hired for.
  await client.query(
    `UPDATE trainers
        SET courses = (
          SELECT COALESCE(ARRAY_AGG(DISTINCT c), '{}')
          FROM (
            SELECT UNNEST(courses) AS c FROM trainers WHERE id = ANY($2::uuid[])
            UNION
            SELECT UNNEST(courses) AS c FROM trainers WHERE id = $1
          ) u
        )
      WHERE id = $1`,
    [survivorId, loserIds],
  );

  const { rowCount: enrollmentsMoved } = await client.query(
    `UPDATE enrollments
        SET trainer_id = $1, updated_at = NOW()
      WHERE trainer_id = ANY($2::uuid[])`,
    [survivorId, loserIds],
  );

  // Refresh the name snapshot across EVERY enrollment now pointing at the
  // survivor, not just the ones that moved: the survivor's own rows still carry
  // whatever spelling was typed at the time ("RAHUL SHARMA"), and leaving those
  // stale is exactly the inconsistency the snapshot exists to prevent.
  const { rowCount: namesSynced } = await client.query(
    `UPDATE enrollments
        SET trainer = $2, updated_at = NOW()
      WHERE trainer_id = $1
        AND deleted = FALSE
        AND trainer IS DISTINCT FROM $2`,
    [survivorId, survivor.name],
  );

  const { rowCount: payoutsMoved } = await client.query(
    "UPDATE trainer_payouts SET trainer_id = $1 WHERE trainer_id = ANY($2::uuid[])",
    [survivorId, loserIds],
  );

  const { rowCount: deleted } = await client.query(
    "DELETE FROM trainers WHERE id = ANY($1::uuid[])",
    [loserIds],
  );

  return { enrollmentsMoved, namesSynced, payoutsMoved, deleted };
}

export {
  createTrainer,
  listTrainers,
  listTrainersWithStats,
  findTrainerById,
  findTrainersByName,
  updateTrainer,
  deleteTrainer,
  countTrainerEnrollments,
  mergeTrainers,
};

export default {
  createTrainer,
  listTrainers,
  listTrainersWithStats,
  findTrainerById,
  findTrainersByName,
  updateTrainer,
  deleteTrainer,
  countTrainerEnrollments,
  mergeTrainers,
};
