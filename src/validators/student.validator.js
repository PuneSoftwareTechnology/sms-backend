import { z  } from 'zod';
const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().min(8).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateProfileSchema = z.object({
  body: z.object({
    city: z.string().optional(),
    area: z.string().optional(),
    graduation: z.string().optional(),
    postGraduation: z.string().optional(),
    employmentStatus: z.string().optional(),
    itExpYears: z.number().min(0).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export {
signupSchema,
  updateProfileSchema,
};

export default {
signupSchema,
  updateProfileSchema,
};
