import { z } from 'zod';

const signupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(10).max(10).optional(),
    city: z.string().optional(),
    area: z.string().optional(),
    graduation: z.string().optional(),
    graduationYear: z.coerce.number().min(1980).max(2030).optional().nullable(),
    postGraduation: z.string().optional(),
    pgYear: z.coerce.number().min(1980).max(2030).optional().nullable(),
    employmentStatus: z.string().optional(),
    lastWorkedYear: z.coerce.number().min(1980).max(2030).optional().nullable(),
    itExperienceYears: z.coerce.number().min(0).optional(),
    itExperienceMonths: z.coerce.number().min(0).max(11).optional(),
    nonItExperienceYears: z.coerce.number().min(0).optional(),
    nonItExperienceMonths: z.coerce.number().min(0).max(11).optional(),
    certifications: z.array(z.object({
      name: z.string().min(1),
      url: z.string().url(),
    })).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export { signupSchema, updateProfileSchema };
export default { signupSchema, updateProfileSchema };
