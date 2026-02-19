import { z } from 'zod';

const createTestSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    durationMinutes: z.number().int().positive().optional(),
    startedAt: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const createQuestionSchema = z.object({
  body: z.object({ question: z.string().min(2), correctAnswer: z.string().min(1) }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

const updateQuestionSchema = z.object({
  body: z.object({ question: z.string().min(2), correctAnswer: z.string().min(1) }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

const submitTestSchema = z.object({
  body: z.object({
    testId: z.string().uuid(),
    answers: z.array(
      z.object({
        questionId: z.string().uuid(),
        answer: z.string(),
      }),
    ),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export { createTestSchema, createQuestionSchema, updateQuestionSchema, submitTestSchema };
export default { createTestSchema, createQuestionSchema, updateQuestionSchema, submitTestSchema };
