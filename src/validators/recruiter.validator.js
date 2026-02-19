import { z } from 'zod';

const shortlistSchema = z.object({
  body: z.object({ studentId: z.string().uuid(), course: z.string().min(2) }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const downloadSchema = z.object({
  body: z.object({ studentId: z.string().uuid() }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const createRecruiterSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const candidateFilterQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    city: z.string().optional(),
    course: z.string().optional(),
    minExperience: z.string().optional(),
  }),
});

export { shortlistSchema, downloadSchema, createRecruiterSchema, candidateFilterQuerySchema };
export default { shortlistSchema, downloadSchema, createRecruiterSchema, candidateFilterQuerySchema };
