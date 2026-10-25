import { z } from "zod";

/**
 * Record-keeping fields for the Trainers page — PAN, bank details, standing
 * fee, free-text comment. Nothing else in the system reads them, so they are
 * length-checked rather than format-enforced: an admin typing what is on the
 * cheque must never be blocked by our idea of the format. The UI nudges toward
 * the right shape.
 */
const optionalText = (max) => z.string().trim().max(max).nullable().optional();

/** Accounts a payout instalment can go out of, as stored in installmentN_mode. */
const PAYOUT_MODES = ["HDFC", "ICICI", "INDUSIND", "CASH"];

const trainerDetailFields = {
  panNumber: optionalText(20),
  beneficiaryName: optionalText(150),
  bankName: optionalText(150),
  ifscCode: optionalText(20),
  accountNumber: optionalText(40),
  // Free text, not a number: rates are agreed as "40% of course fees" or
  // "15k for Agentic AI, 12k for Python full stack" as often as a flat amount.
  fees: optionalText(500),
  comment: optionalText(1000),
};

const createTrainerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Trainer name is required").max(150),
    // Courses the trainer is hired for — a hint for the enrollment dropdown,
    // never a restriction on who can be assigned what.
    courses: z.array(z.string()).optional(),
    note: z.string().max(200).nullable().optional(),
    ...trainerDetailFields,
    isActive: z.boolean().optional(),
    // Set once the user has confirmed a same-name trainer is a different person.
    confirmDuplicate: z.boolean().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateTrainerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(150).optional(),
      courses: z.array(z.string()).optional(),
      note: z.string().max(200).nullable().optional(),
      ...trainerDetailFields,
      isActive: z.boolean().optional(),
    })
    // Keyed on the object rather than a hand-written list of fields, so adding
    // another optional column cannot silently make this check wrong.
    .refine((d) => Object.keys(d).length > 0, {
      message: "At least one field is required",
    }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

const mergeTrainersSchema = z.object({
  body: z.object({
    survivorId: z.string().uuid(),
    loserIds: z.array(z.string().uuid()).min(1, "Select trainers to merge in"),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const money = z.number().min(0).nullable().optional();

const updateTrainerPayoutSchema = z.object({
  body: z
    .object({
      training_fee: z.number().min(0).optional(),
      // The "1st 50%" split is a percentage so an uneven split needs no schema
      // change; 100 records a single full payment.
      split1_percent: z.number().min(0).max(100).optional(),
      installment1_amount: money,
      installment1_date: z.string().nullable().optional(),
      installment1_tds: money,
      installment1_mode: z.string().nullable().optional(),
      installment2_amount: money,
      installment2_date: z.string().nullable().optional(),
      installment2_tds: money,
      installment2_mode: z.string().nullable().optional(),
      comment: z.string().nullable().optional(),
      // null clears the manual override and falls back to the derived status.
      payment_status: z
        .enum(["UNPAID", "PARTIAL", "PAID", "HOLD"])
        .nullable()
        .optional(),
    })
    .refine((d) => Object.keys(d).length > 0, {
      message: "At least one field is required",
    }),
  params: z.object({ enrollmentId: z.string().uuid() }),
  query: z.object({}).optional(),
});

const trainerPayoutFilterSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    trainerId: z.string().uuid().optional(),
    institute: z.string().optional(),
    course: z.string().optional(),
    batch: z.string().optional(),
    completionStatus: z.string().optional(),
    paymentStatus: z.enum(["UNPAID", "PARTIAL", "PAID", "HOLD", "NOT_SET"]).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    // Payment dates, not enrollment dates — used by the month drill-down from
    // the Trainer Payment Figures report.
    paidFrom: z.string().optional(),
    paidTo: z.string().optional(),
    paymentSeq: z.enum(["BOTH", "FIRST", "SECOND"]).optional(),
    // Account the instalment went out of — narrows the paid-date filter above.
    paymentMode: z.enum(PAYOUT_MODES).optional(),
    // Only rows with an outstanding (or overpaid) balance — the Balance to Pay
    // drill-down from the figures report. A string enum rather than a coerced
    // boolean, since z.coerce.boolean("false") would be true.
    hasBalance: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    // Only instalments that had TDS deducted — the TDS report's drill-down.
    hasTds: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    search: z.string().optional(),
  }),
});

const trainerPaymentFiguresSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    // Start year of the Indian financial year: 2026 means Apr 2026 - Mar 2027.
    financialYear: z.coerce.number().int().min(2000).max(2100),
    batch: z.string().optional(),
    course: z.string().optional(),
    completionStatus: z.string().optional(),
    // BOTH is the default; FIRST / SECOND narrow to one instalment.
    paymentSeq: z.enum(["BOTH", "FIRST", "SECOND"]).optional(),
    // Only instalments paid out of this account; all modes when omitted.
    paymentMode: z.enum(PAYOUT_MODES).optional(),
  }),
});

export {
  trainerPaymentFiguresSchema,
  createTrainerSchema,
  updateTrainerSchema,
  mergeTrainersSchema,
  updateTrainerPayoutSchema,
  trainerPayoutFilterSchema,
};

export default {
  trainerPaymentFiguresSchema,
  createTrainerSchema,
  updateTrainerSchema,
  mergeTrainersSchema,
  updateTrainerPayoutSchema,
  trainerPayoutFilterSchema,
};
