import pool from "../config/db.js";
import { parsePagination, paginatedResult } from "../validators/common.validator.js";

/**
 * Trainer payout tracker.
 *
 * Rows are driven by enrollments, not by payout records: every enrollment that
 * has a trainer assigned appears in the tracker immediately, and the
 * trainer_payouts row is created on first edit. That way a newly enrolled
 * student can never be silently missing from what we owe someone.
 *
 * Money model (see docs/trainer-payouts.md):
 *   split1 fee  = training_fee * split1_percent / 100   (the "1st 50%" column)
 *   settled(n)  = amount_paid(n) + tds_deducted(n)
 *   balance     = training_fee - settled1 - settled2
 * TDS counts as settled because it is withheld out of the gross owed, not
 * charged on top of it.
 */

const STUDENT_PAID = `(
  COALESCE(e.installment1_amount, 0)
  + COALESCE(e.installment2_amount, 0)
  + COALESCE(e.installment3_amount, 0)
)`;

/** Gross discharged against the training fee for one installment. */
const SETTLED = (n) =>
  `(COALESCE(p.installment${n}_amount, 0) + COALESCE(p.installment${n}_tds, 0))`;

/**
 * Built as a function rather than a template with a placeholder: the WHERE
 * clause is full of `$1`, `$2` placeholders, and String.replace() gives `$`
 * sequences special meaning in the replacement text.
 */
const baseCte = (baseWhere) => `
  WITH base AS (
    SELECT
      e.id                  AS enrollment_id,
      e.start_date          AS start_date,
      e.course              AS course,
      e.batch               AS batch,
      e.institute           AS institute,
      e.total_fee           AS total_fee,
      e.completion_status   AS completion_status,
      u.name                AS student_name,
      t.id                  AS trainer_id,
      t.trainer_code        AS trainer_code,
      t.name                AS trainer_name,
      t.courses             AS trainer_courses,
      t.note                AS trainer_note,
      p.id                  AS payout_id,
      p.split1_percent      AS split1_percent,
      p.installment1_amount AS installment1_amount,
      p.installment1_date   AS installment1_date,
      p.installment1_tds    AS installment1_tds,
      p.installment1_mode   AS installment1_mode,
      p.installment2_amount AS installment2_amount,
      p.installment2_date   AS installment2_date,
      p.installment2_tds    AS installment2_tds,
      p.installment2_mode   AS installment2_mode,
      p.comment             AS comment,
      p.payment_status      AS payment_status_override,
      ${STUDENT_PAID}       AS student_paid,
      COALESCE(p.training_fee, 0)   AS fee,
      ${SETTLED(1)}         AS settled1,
      ${SETTLED(2)}         AS settled2
    FROM enrollments e
    JOIN users u    ON e.student_id = u.id
    JOIN trainers t ON e.trainer_id = t.id
    LEFT JOIN trainer_payouts p ON p.enrollment_id = e.id
    WHERE ${baseWhere}
  ),
  computed AS (
    SELECT
      b.*,
      ROUND(b.fee * COALESCE(b.split1_percent, 50) / 100, 2) AS split1_fee,
      b.fee - ROUND(b.fee * COALESCE(b.split1_percent, 50) / 100, 2) AS split2_fee,
      b.fee - b.settled1 - b.settled2 AS balance,
      COALESCE(
        b.payment_status_override,
        CASE
          WHEN b.fee = 0                             THEN 'NOT_SET'
          WHEN (b.settled1 + b.settled2) <= 0        THEN 'UNPAID'
          WHEN (b.settled1 + b.settled2) >= b.fee    THEN 'PAID'
          ELSE 'PARTIAL'
        END
      ) AS payment_status
    FROM base b
  )
`;

/** Filters applied inside `base`, before the derived columns exist. */
function buildBaseWhere(filters, values) {
  // Only enrollments with a trainer can carry a payout.
  const conditions = ["e.deleted = FALSE", "e.trainer_id IS NOT NULL"];

  if (filters.trainerId) {
    values.push(filters.trainerId);
    conditions.push(`t.id = $${values.length}`);
  }
  if (filters.institute) {
    values.push(filters.institute);
    conditions.push(`e.institute = $${values.length}`);
  }
  if (filters.course) {
    values.push(filters.course);
    conditions.push(`e.course = $${values.length}`);
  }
  if (filters.completionStatus) {
    values.push(filters.completionStatus);
    conditions.push(`e.completion_status = $${values.length}`);
  }
  if (filters.batch) {
    values.push(filters.batch);
    conditions.push(`e.batch = $${values.length}`);
  }
  if (filters.fromDate) {
    values.push(filters.fromDate);
    conditions.push(`e.start_date >= $${values.length}`);
  }
  if (filters.toDate) {
    values.push(filters.toDate);
    conditions.push(`e.start_date <= $${values.length}`);
  }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(
      `(u.name ILIKE $${values.length} OR t.name ILIKE $${values.length} OR t.trainer_code ILIKE $${values.length})`,
    );
  }

  return conditions.join(" AND ");
}

/** Payment status is derived, so it can only be filtered after `computed`. */
function buildComputedWhere(filters, values) {
  const conditions = ["1=1"];
  if (filters.paymentStatus) {
    values.push(filters.paymentStatus);
    conditions.push(`payment_status = $${values.length}`);
  }
  return conditions.join(" AND ");
}

const SELECT_COLUMNS = `
  enrollment_id        AS "id",
  payout_id            AS "payoutId",
  start_date           AS "enrollmentDate",
  student_name         AS "studentName",
  course               AS "course",
  batch                AS "batch",
  institute            AS "institute",
  total_fee            AS "totalFee",
  CASE WHEN completion_status = 'DROPOUT' THEN 0
       ELSE total_fee - student_paid
  END                  AS "pendingFee",
  completion_status    AS "completionStatus",
  trainer_id           AS "trainerId",
  trainer_code         AS "trainerCode",
  trainer_name         AS "trainerName",
  trainer_courses      AS "trainerCourses",
  trainer_note         AS "trainerNote",
  fee                  AS "trainingFee",
  COALESCE(split1_percent, 50) AS "split1Percent",
  split1_fee           AS "split1Fee",
  installment1_amount  AS "installment1Amount",
  installment1_date    AS "installment1Date",
  installment1_tds     AS "installment1Tds",
  installment1_mode    AS "installment1Mode",
  split2_fee           AS "split2Fee",
  installment2_amount  AS "installment2Amount",
  installment2_date    AS "installment2Date",
  installment2_tds     AS "installment2Tds",
  installment2_mode    AS "installment2Mode",
  balance              AS "balanceToPay",
  comment              AS "comment",
  payment_status       AS "paymentStatus",
  payment_status_override IS NOT NULL AS "paymentStatusManual"
`;

async function listTrainerPayouts(filters = {}, client = pool) {
  const { page, limit, offset } = parsePagination(filters);

  const values = [];
  const baseWhere = buildBaseWhere(filters, values);
  const computedWhere = buildComputedWhere(filters, values);
  const cte = baseCte(baseWhere);

  const countResult = await client.query(
    `${cte} SELECT COUNT(*)::int AS total FROM computed WHERE ${computedWhere}`,
    values,
  );
  const total = countResult.rows[0].total;

  values.push(limit);
  values.push(offset);
  const { rows } = await client.query(
    `${cte}
     SELECT ${SELECT_COLUMNS}
     FROM computed
     WHERE ${computedWhere}
     ORDER BY start_date DESC NULLS LAST, student_name ASC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );

  return paginatedResult(rows, total, page, limit);
}

/** Every payout row for one trainer, plus their money rollup. */
async function trainerSummary(trainerId, client = pool) {
  const values = [];
  const baseWhere = buildBaseWhere({ trainerId }, values);
  const cte = baseCte(baseWhere);

  const { rows } = await client.query(
    `${cte}
     SELECT
       COUNT(*)::int              AS "studentCount",
       COALESCE(SUM(fee), 0)      AS "totalTrainingFee",
       COALESCE(SUM(COALESCE(installment1_amount,0) + COALESCE(installment2_amount,0)), 0) AS "totalPaid",
       COALESCE(SUM(COALESCE(installment1_tds,0) + COALESCE(installment2_tds,0)), 0)       AS "totalTds",
       COALESCE(SUM(balance), 0)  AS "totalBalance"
     FROM computed`,
    values,
  );
  return rows[0];
}

async function findPayoutByEnrollment(enrollmentId, client = pool) {
  const { rows } = await client.query(
    "SELECT * FROM trainer_payouts WHERE enrollment_id = $1",
    [enrollmentId],
  );
  return rows[0] || null;
}

const PAYOUT_FIELDS = [
  "training_fee",
  "split1_percent",
  "installment1_amount",
  "installment1_date",
  "installment1_tds",
  "installment1_mode",
  "installment2_amount",
  "installment2_date",
  "installment2_tds",
  "installment2_mode",
  "comment",
  "payment_status",
];

const DATE_FIELDS = new Set(["installment1_date", "installment2_date"]);

/**
 * Creates the payout row on first edit, then applies only the supplied fields —
 * so clearing a payment date to null works, which a plain ON CONFLICT upsert
 * with COALESCE could not express.
 */
async function upsertPayout(enrollmentId, trainerId, payload, client = pool) {
  await client.query(
    `INSERT INTO trainer_payouts (enrollment_id, trainer_id)
     VALUES ($1, $2)
     ON CONFLICT (enrollment_id) DO NOTHING`,
    [enrollmentId, trainerId || null],
  );

  const fields = [];
  const values = [];

  // Keep the payout pointing at whoever the enrollment says the trainer is.
  if (trainerId) {
    values.push(trainerId);
    fields.push(`trainer_id = $${values.length}`);
  }

  for (const field of PAYOUT_FIELDS) {
    if (payload[field] === undefined) continue;
    const raw = payload[field];
    const value = DATE_FIELDS.has(field) && raw === "" ? null : raw;
    values.push(value);
    fields.push(`${field} = $${values.length}`);
  }

  if (fields.length === 0) return findPayoutByEnrollment(enrollmentId, client);

  values.push(enrollmentId);
  const { rows } = await client.query(
    `UPDATE trainer_payouts SET ${fields.join(", ")}
      WHERE enrollment_id = $${values.length}
      RETURNING *`,
    values,
  );
  return rows[0] || null;
}

/**
 * Clears the recorded payment for one enrollment.
 *
 * Deletes the trainer_payouts record only — never the enrollment. The tracker
 * row is driven by the enrollment, so it reappears immediately with nothing
 * recorded against it, which is the point: this is a reset, not a removal.
 */
async function deletePayout(enrollmentId, client = pool) {
  const { rows } = await client.query(
    "DELETE FROM trainer_payouts WHERE enrollment_id = $1 RETURNING id",
    [enrollmentId],
  );
  return rows[0] || null;
}

/** Distinct values backing the tracker's filter dropdowns. */
async function payoutFilterOptions(client = pool) {
  const { rows } = await client.query(`
    SELECT
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT e.course), NULL) AS courses,
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT e.batch), NULL)  AS batches
    FROM enrollments e
    WHERE e.deleted = FALSE AND e.trainer_id IS NOT NULL
  `);
  return {
    courses: rows[0]?.courses ?? [],
    batches: rows[0]?.batches ?? [],
  };
}

export {
  listTrainerPayouts,
  trainerSummary,
  findPayoutByEnrollment,
  upsertPayout,
  deletePayout,
  payoutFilterOptions,
};

export default {
  listTrainerPayouts,
  trainerSummary,
  findPayoutByEnrollment,
  upsertPayout,
  deletePayout,
  payoutFilterOptions,
};
