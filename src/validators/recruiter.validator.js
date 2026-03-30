import { z } from "zod";

const studentIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ studentId: z.string().uuid() }),
  query: z.object({}).optional(),
});

const shortlistParamSchema = z.object({
  body: z.object({ course: z.string().min(2) }),
  params: z.object({ studentId: z.string().uuid() }),
  query: z.object({}).optional(),
});

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
    phone: z.string().min(10),
    email: z.string().email(),
    password: z.string().min(6),
    companyName: z.string().optional(),
    designation: z.string().optional(),
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

const bulkShortlistSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      studentId: z.string().uuid(),
      course: z.string().min(2),
    })).min(1).max(50),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const bulkRemoveShortlistSchema = z.object({
  body: z.object({
    studentIds: z.array(z.string().uuid()).min(1).max(50),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateRecruiterSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    email: z.string().email().optional(),
    companyName: z.string().optional(),
    designation: z.string().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export {
  studentIdParamSchema,
  shortlistParamSchema,
  shortlistSchema,
  downloadSchema,
  createRecruiterSchema,
  updateRecruiterSchema,
  candidateFilterQuerySchema,
  bulkShortlistSchema,
  bulkRemoveShortlistSchema,
};
export default {
  studentIdParamSchema,
  shortlistParamSchema,
  shortlistSchema,
  downloadSchema,
  createRecruiterSchema,
  updateRecruiterSchema,
  candidateFilterQuerySchema,
  bulkShortlistSchema,
  bulkRemoveShortlistSchema,
};
