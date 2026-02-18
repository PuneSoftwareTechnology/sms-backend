import { z  } from 'zod';
const createTestSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    isActive: z.boolean().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const submitTestSchema = z.object({
  body: z.object({
    testId: z.number().int().positive(),
    answers: z.array(
      z.object({
        questionId: z.number().int().positive(),
        answer: z.string(),
      }),
    ),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export {
createTestSchema,
  submitTestSchema,
};

export default {
createTestSchema,
  submitTestSchema,
};
