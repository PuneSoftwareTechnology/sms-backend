import { z } from 'zod';

const createAdminSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const createQrSchema = z.object({
  body: z.object({
    bank_name: z.string().min(1),
    branch: z.string().optional(),
    upi_id: z.string().min(1),
    account_number: z.string().min(1),
    ifsc_code: z.string().min(1),
    is_active: z.string().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export { createAdminSchema, createQrSchema };
export default { createAdminSchema, createQrSchema };
