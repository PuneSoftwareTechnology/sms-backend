import { z  } from 'zod';
const shortlistSchema = z.object({
  body: z.object({
    studentId: z.number().int().positive(),
    course: z.string().min(2),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const downloadSchema = z.object({
  body: z.object({
    studentId: z.number().int().positive(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export {
shortlistSchema,
  downloadSchema,
};

export default {
shortlistSchema,
  downloadSchema,
};
