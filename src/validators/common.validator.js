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

const testStudentParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    testId: z.string().uuid(),
    studentId: z.string().uuid(),
  }),
  query: z.object({}).optional(),
});

const evaluationIdParamSchema = z.object({
  body: z.object({
    communicationScore: z.number().min(0).max(10).optional(),
    scopeForImprovement: z.string().optional(),
    trainerRemark: z.string().optional(),
  }).refine(
    (data) => data.communicationScore !== undefined || data.scopeForImprovement !== undefined || data.trainerRemark !== undefined,
    { message: "At least one field (communicationScore, scopeForImprovement, trainerRemark) is required" },
  ),
  params: z.object({ evaluationId: z.string().uuid() }),
  query: z.object({}).optional(),
});


const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

function parsePagination(filters = {}) {
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 50));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function paginatedResult(rows, total, page, limit) {
  return { items: rows, total, page, totalPages: Math.ceil(total / limit) };
}

export { uuidIdParamSchema, userIdParamSchema, enrollmentIdParamSchema, qrIdParamSchema, evaluationIdParamSchema, testStudentParamSchema, paginationQuerySchema, parsePagination, paginatedResult };
export default { uuidIdParamSchema, userIdParamSchema, enrollmentIdParamSchema, qrIdParamSchema, evaluationIdParamSchema, testStudentParamSchema, paginationQuerySchema, parsePagination, paginatedResult };
