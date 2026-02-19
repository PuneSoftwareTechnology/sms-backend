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
    label: z.string().optional(),
    imageUrl: z.string().url().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export { createAdminSchema, createQrSchema };
export default { createAdminSchema, createQrSchema };
