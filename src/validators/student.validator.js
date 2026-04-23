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
      // S3 key only — never a URL. S3 enforces 1024 chars; we cap below that and
      // reject anything resembling a URL so a resolved link can't round-trip back in.
      certificate: z.string().max(512).refine(
        (v) => !/^https?:\/\//i.test(v),
        { message: 'certificate must be an S3 key, not a URL' },
      ).optional(),
    })).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const uploadUrlSchema = z.object({
  body: z.object({
    type: z.enum(['profile-photo', 'cv', 'project', 'certificate']),
    filename: z.string().min(1).max(255),
    contentType: z.string().min(1).max(100),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const uploadConfirmSchema = z.object({
  body: z.object({
    type: z.enum(['profile-photo', 'cv', 'project', 'certificate']),
    key: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export { signupSchema, updateProfileSchema, uploadUrlSchema, uploadConfirmSchema };
export default { signupSchema, updateProfileSchema, uploadUrlSchema, uploadConfirmSchema };
