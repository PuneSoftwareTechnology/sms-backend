import { z } from 'zod';

const createTestSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    course: z.string().min(1),
    durationMinutes: z.number().int().positive().optional(),
    endTime: z.string().optional(),
    isPublished: z.boolean().optional(),
    questions: z
      .array(
        z.object({
          question: z.string().min(2),
          options: z.array(z.string().min(1)).length(4),
          correctOptionIndex: z.number().int().min(0).max(3),
          marks: z.number().int().positive().optional(),
        }),
      )
      .min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateTestSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    course: z.string().min(1).optional(),
    durationMinutes: z.number().int().positive().optional(),
    endTime: z.string().optional(),
    isPublished: z.boolean().optional(),
    questions: z
      .array(
        z.object({
          question: z.string().min(2),
          options: z.array(z.string().min(1)).length(4),
          correctOptionIndex: z.number().int().min(0).max(3),
          marks: z.number().int().positive().optional(),
        }),
      )
      .min(1)
      .optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

const createQuestionSchema = z.object({
  body: z.object({
    question: z.string().min(2),
    options: z.array(z.string().min(1)).length(4),
    correctAnswer: z.string().min(1),
    marks: z.number().int().positive().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

const updateQuestionSchema = z.object({
  body: z.object({
    question: z.string().min(2),
    options: z.array(z.string().min(1)).length(4),
    correctAnswer: z.string().min(1),
    marks: z.number().int().positive().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

const testIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ testId: z.string().uuid() }),
  query: z.object({}).optional(),
});

const submitTestSchema = z.object({
  body: z.object({
    attemptId: z.string().uuid(),
    answers: z.record(z.string(), z.number().int().min(0).max(3)),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export {
  createTestSchema,
  updateTestSchema,
  createQuestionSchema,
  updateQuestionSchema,
  testIdParamSchema,
  submitTestSchema,
};

export default {
  createTestSchema,
  updateTestSchema,
  createQuestionSchema,
  updateQuestionSchema,
  testIdParamSchema,
  submitTestSchema,
};
