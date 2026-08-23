import ApiError from "../utils/apiError.js";
import trainerPayoutRepository from "../repositories/trainerPayout.repository.js";
import trainerRepository from "../repositories/trainer.repository.js";
import enrollmentRepository from "../repositories/enrollment.repository.js";

async function listPayouts(filters = {}) {
  const [result, options] = await Promise.all([
    trainerPayoutRepository.listTrainerPayouts(filters),
    trainerPayoutRepository.payoutFilterOptions(),
  ]);
  return { ...result, ...options };
}

/**
 * The tracker row is keyed on the enrollment, and the payout follows whoever
 * that enrollment says the trainer is — reassigning a course moves the money
 * owed with it rather than leaving it against the previous trainer.
 */
async function updatePayout(enrollmentId, payload) {
  const enrollment =
    await enrollmentRepository.findEnrollmentDetailsById(enrollmentId);
  if (!enrollment) throw new ApiError(404, "Enrollment not found");
  if (!enrollment.trainer_id) {
    throw new ApiError(
      400,
      "Assign a trainer to this enrollment before recording a payout",
    );
  }

  if (payload.split1_percent !== undefined) {
    const pct = Number(payload.split1_percent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      throw new ApiError(400, "First instalment share must be between 0 and 100");
    }
  }

  return trainerPayoutRepository.upsertPayout(
    enrollmentId,
    enrollment.trainer_id,
    payload,
  );
}

/**
 * Resets one tracker row: the payout record goes, the enrollment stays. Nothing
 * to delete is not an error — the row simply had no payment recorded yet.
 */
async function clearPayout(enrollmentId) {
  const enrollment =
    await enrollmentRepository.findEnrollmentDetailsById(enrollmentId);
  if (!enrollment) throw new ApiError(404, "Enrollment not found");

  const deleted = await trainerPayoutRepository.deletePayout(enrollmentId);
  return { cleared: !!deleted, enrollmentId };
}

async function getTrainerDetail(trainerId, filters = {}) {
  const trainer = await trainerRepository.findTrainerById(trainerId);
  if (!trainer) throw new ApiError(404, "Trainer not found");

  const [summary, payouts] = await Promise.all([
    trainerPayoutRepository.trainerSummary(trainerId),
    trainerPayoutRepository.listTrainerPayouts({ ...filters, trainerId }),
  ]);

  // "Hired for" is the manually tagged course list; what they are actually
  // teaching is derived from their enrollments and shown alongside it, so the
  // tags never drift into meaning "everything".
  const teachingCourses = [
    ...new Set(payouts.items.map((row) => row.course).filter(Boolean)),
  ].sort();

  return { trainer, summary, teachingCourses, ...payouts };
}

/**
 * Trainer Payment Figures report: a trainer x month matrix of amounts paid,
 * plus the filter option lists the report's dropdowns need.
 */
async function getPaymentFigures(filters = {}) {
  const [rows, options] = await Promise.all([
    trainerPayoutRepository.trainerPaymentFigures(filters),
    trainerPayoutRepository.payoutFilterOptions(),
  ]);
  return { rows, ...options };
}

export {
  listPayouts,
  updatePayout,
  clearPayout,
  getTrainerDetail,
  getPaymentFigures,
};

export default {
  listPayouts,
  updatePayout,
  clearPayout,
  getTrainerDetail,
  getPaymentFigures,
};
