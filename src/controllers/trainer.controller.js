import trainerService from "../services/trainer.service.js";
import trainerPayoutService from "../services/trainerPayout.service.js";
import { ok } from "../utils/apiResponse.js";

// ─── Trainers ────────────────────────────────────────────────────────────────

/** Populates the trainer dropdown on the enrollment form. Read-only, so admins reach it. */
async function listTrainers(req, res) {
  const filters = {
    isActive:
      req.query.isActive === undefined
        ? undefined
        : req.query.isActive === "true",
    search: req.query.search || undefined,
    course: req.query.course || undefined,
  };
  const rows = await trainerService.listTrainers(filters);
  return ok(res, rows, "Trainers fetched");
}

/** Trainers management list — carries enrollment counts and derived course usage. */
async function listTrainersWithStats(req, res) {
  const filters = {
    isActive:
      req.query.isActive === undefined
        ? undefined
        : req.query.isActive === "true",
    search: req.query.search || undefined,
  };
  const rows = await trainerService.listTrainersWithStats(filters);
  return ok(res, rows, "Trainers fetched");
}

async function createTrainer(req, res) {
  const row = await trainerService.createTrainer(req.validated.body);
  return ok(res, row, "Trainer created", 201);
}

async function updateTrainer(req, res) {
  const row = await trainerService.updateTrainer(
    req.params.id,
    req.validated.body,
  );
  return ok(res, row, "Trainer updated");
}

async function deleteTrainer(req, res) {
  const row = await trainerService.deleteTrainer(req.params.id);
  return ok(res, row, "Trainer deleted");
}

async function mergeTrainers(req, res) {
  const { survivorId, loserIds } = req.validated.body;
  const result = await trainerService.mergeTrainers(survivorId, loserIds);
  return ok(
    res,
    result,
    `Merged ${result.deleted} trainer(s) into ${result.survivor.name}`,
  );
}

// ─── Payouts ─────────────────────────────────────────────────────────────────

async function listTrainerPayouts(req, res) {
  const result = await trainerPayoutService.listPayouts(req.validated.query);
  return ok(res, result, "Trainer payouts fetched");
}

async function updateTrainerPayout(req, res) {
  const row = await trainerPayoutService.updatePayout(
    req.params.enrollmentId,
    req.validated.body,
  );
  return ok(res, row, "Trainer payout updated");
}

async function clearTrainerPayout(req, res) {
  const result = await trainerPayoutService.clearPayout(req.params.enrollmentId);
  return ok(
    res,
    result,
    result.cleared
      ? "Trainer payment cleared"
      : "Nothing was recorded for this row",
  );
}

async function getTrainerDetail(req, res) {
  const result = await trainerPayoutService.getTrainerDetail(req.params.id, {
    page: req.query.page,
    limit: req.query.limit,
  });
  return ok(res, result, "Trainer detail fetched");
}

export {
  listTrainers,
  listTrainersWithStats,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  mergeTrainers,
  listTrainerPayouts,
  updateTrainerPayout,
  clearTrainerPayout,
  getTrainerDetail,
};

export default {
  listTrainers,
  listTrainersWithStats,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  mergeTrainers,
  listTrainerPayouts,
  updateTrainerPayout,
  clearTrainerPayout,
  getTrainerDetail,
};
