import { z } from "zod";

const updateBatchEndDateSchema = z.object({
  body: z.object({ endDate: z.string().min(8) }),
  params: z.object({ batch: z.string().min(1) }),
  query: z.object({}).optional(),
});

const updateEnrollmentSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    enrollment_status: z.enum(["NEW", "APPROVED", "REJECTED"]).optional(),
    institute: z.string().optional(),
    course: z.string().optional(),
    batch: z.string().nullable().optional(),
    trainer: z.string().nullable().optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    completion_status: z.enum(["IN_PROGRESS", "ACTIVE", "DROPOUT", "COMPLETED"]).optional(),
    total_fee: z.number().min(0).optional(),
    placement_status: z.string().nullable().optional(),
    company_name: z.string().nullable().optional(),
    certificate_url: z.string().nullable().optional(),
    installment1_amount: z.number().min(0).nullable().optional(),
    installment1_date: z.string().nullable().optional(),
    installment1_mode: z.string().nullable().optional(),
    installment2_amount: z.number().min(0).nullable().optional(),
    installment2_date: z.string().nullable().optional(),
    installment2_mode: z.string().nullable().optional(),
    installment3_amount: z.number().min(0).nullable().optional(),
    installment3_date: z.string().nullable().optional(),
    installment3_mode: z.string().nullable().optional(),
  }),
  params: z.object({ enrollmentId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export { updateBatchEndDateSchema, updateEnrollmentSchema };
export default { updateBatchEndDateSchema, updateEnrollmentSchema };
