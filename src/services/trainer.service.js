import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import trainerRepository from "../repositories/trainer.repository.js";

/** Same normalization the repository matches on: trim, collapse spaces, fold case. */
function normalizeName(name) {
  return (name || "").trim().replace(/\s+/g, " ");
}

function cleanCourses(courses) {
  if (!Array.isArray(courses)) return [];
  const seen = new Set();
  const out = [];
  for (const course of courses) {
    const trimmed = (course || "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/**
 * Two real people can share a name, so a duplicate is a warning and not an
 * error — but it has to be confirmed deliberately. Most duplicates are a
 * re-entry of someone who already exists, and silently creating a second record
 * splits their payments across two rows nobody notices.
 */
async function createTrainer(payload) {
  const name = normalizeName(payload.name);
  if (!name) throw new ApiError(400, "Trainer name is required");

  if (!payload.confirmDuplicate) {
    const existing = await trainerRepository.findTrainersByName(name);
    if (existing.length > 0) {
      const codes = existing.map((t) => t.code).join(", ");
      throw new ApiError(
        409,
        `A trainer named "${name}" already exists (${codes}). Confirm to create a separate trainer.`,
      );
    }
  }

  return trainerRepository.createTrainer({
    name,
    courses: cleanCourses(payload.courses),
    note: payload.note?.trim() || null,
    isActive: payload.isActive,
  });
}

async function listTrainers(filters = {}) {
  return trainerRepository.listTrainers(filters);
}

async function listTrainersWithStats(filters = {}) {
  return trainerRepository.listTrainersWithStats(filters);
}

async function getTrainer(id) {
  const trainer = await trainerRepository.findTrainerById(id);
  if (!trainer) throw new ApiError(404, "Trainer not found");
  return trainer;
}

async function updateTrainer(id, payload) {
  await getTrainer(id);

  const updates = {};
  if (payload.name !== undefined) {
    const name = normalizeName(payload.name);
    if (!name) throw new ApiError(400, "Trainer name is required");
    updates.name = name;
  }
  if (payload.courses !== undefined) updates.courses = cleanCourses(payload.courses);
  if (payload.note !== undefined) updates.note = payload.note?.trim() || null;
  if (payload.isActive !== undefined) updates.isActive = payload.isActive;

  const updated = await trainerRepository.updateTrainer(id, updates);

  // Keep the denormalized name on enrollments agreeing with trainer_id, so the
  // legacy text column that fee dues and the CSV exports still read stays right.
  if (updates.name) {
    await pool.query(
      "UPDATE enrollments SET trainer = $1, updated_at = NOW() WHERE trainer_id = $2 AND deleted = FALSE",
      [updates.name, id],
    );
  }

  return updated;
}

/**
 * Deleting a trainer with enrollments would orphan their payment history, so
 * that is refused — deactivating hides them from the dropdown without
 * rewriting the past.
 */
async function deleteTrainer(id) {
  await getTrainer(id);

  const count = await trainerRepository.countTrainerEnrollments(id);
  if (count > 0) {
    throw new ApiError(
      409,
      `This trainer is assigned to ${count} enrollment(s). Deactivate them instead, or merge them into another trainer.`,
    );
  }

  return trainerRepository.deleteTrainer(id);
}

/**
 * Cleans up the spelling variants the backfill could not merge on its own.
 * All three tables move together or none do.
 */
async function mergeTrainers(survivorId, loserIds) {
  const ids = [...new Set(loserIds || [])].filter((id) => id !== survivorId);
  if (ids.length === 0) {
    throw new ApiError(400, "Select at least one other trainer to merge in");
  }

  const survivor = await trainerRepository.findTrainerById(survivorId);
  if (!survivor) throw new ApiError(404, "Trainer to keep was not found");

  for (const id of ids) {
    const loser = await trainerRepository.findTrainerById(id);
    if (!loser) throw new ApiError(404, `Trainer ${id} was not found`);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await trainerRepository.mergeTrainers(survivorId, ids, client);
    await client.query("COMMIT");
    return { survivor: await trainerRepository.findTrainerById(survivorId), ...result };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export {
  createTrainer,
  listTrainers,
  listTrainersWithStats,
  getTrainer,
  updateTrainer,
  deleteTrainer,
  mergeTrainers,
};

export default {
  createTrainer,
  listTrainers,
  listTrainersWithStats,
  getTrainer,
  updateTrainer,
  deleteTrainer,
  mergeTrainers,
};
