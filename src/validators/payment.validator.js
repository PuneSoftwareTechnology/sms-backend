import { z  } from 'zod';
const createPaymentSchema = z.object({
  body: z.object({
    enrollmentId: z.number().int().positive(),
    amount: z.number().positive(),
    installmentNumber: z.number().int().positive(),
    receiptUrl: z.string().url().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export {
createPaymentSchema,
};

export default {
createPaymentSchema,
};
