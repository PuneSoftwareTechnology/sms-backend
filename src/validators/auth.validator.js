import { z  } from 'zod';
const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export {
loginSchema,
};

export default {
loginSchema,
};
