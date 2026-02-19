import { z } from 'zod';

const convertEnquirySchema = z.object({
  body: z.object({
    enquiryId: z.string().uuid(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
    course: z.string().min(2),
    batch: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    totalFee: z.number().positive(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateBatchEndDateSchema = z.object({
  body: z.object({ endDate: z.string().min(8) }),
  params: z.object({ batch: z.string().min(1) }),
  query: z.object({}).optional(),
});

export { convertEnquirySchema, updateBatchEndDateSchema };
export default { convertEnquirySchema, updateBatchEndDateSchema };
