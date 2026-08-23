import { z } from "zod";

const createTrainerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Trainer name is required").max(150),
    // Courses the trainer is hired for — a hint for the enrollment dropdown,
    // never a restriction on who can be assigned what.
    courses: z.array(z.string()).optional(),
    note: z.string().max(200).nullable().optional(),
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
      isActive: z.boolean().optional(),
    })
    .refine(
      (d) =>
        d.name !== undefined ||
        d.courses !== undefined ||
        d.note !== undefined ||
        d.isActive !== undefined,
      { message: "At least one field is required" },
    ),
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
    search: z.string().optional(),
  }),
});

export {
  createTrainerSchema,
  updateTrainerSchema,
  mergeTrainersSchema,
  updateTrainerPayoutSchema,
  trainerPayoutFilterSchema,
};

export default {
  createTrainerSchema,
  updateTrainerSchema,
  mergeTrainersSchema,
  updateTrainerPayoutSchema,
  trainerPayoutFilterSchema,
};
