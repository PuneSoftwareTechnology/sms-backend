import { z } from 'zod';

const uuidIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

const userIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ userId: z.string().uuid() }),
  query: z.object({}).optional(),
});

const enrollmentIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ enrollmentId: z.string().uuid() }),
  query: z.object({}).optional(),
});

const qrIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ qrId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export { uuidIdParamSchema, userIdParamSchema, enrollmentIdParamSchema, qrIdParamSchema };
export default { uuidIdParamSchema, userIdParamSchema, enrollmentIdParamSchema, qrIdParamSchema };
