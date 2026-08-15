import { z } from "zod";

const enquiryBody = z.object({
  enquiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional(),
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.string().email().optional()),
  course: z.string().optional(),
  institute: z.string().optional(),
  enquiryType: z.enum(['WALKIN', 'PHONE', 'WEBSITE']).optional(),
  leadStatus: z.string().optional(),
  demoStatus: z.string().optional(),
  demoDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  comment: z.string().optional(),
});

const createEnquirySchema = z.object({
  body: enquiryBody,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateEnquirySchema = z.object({
  body: enquiryBody,
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

const enquiryFilterSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    leadStatus: z.string().optional(),
    demoStatus: z.string().optional(),
    enquiryType: z.string().optional(),
  }),
});

const sendBulkEmailSchema = z.object({
  body: z.object({
    enquiryIds: z.array(z.string().uuid()).min(1),
    subject: z.string().min(1),
    body: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export { createEnquirySchema, updateEnquirySchema, enquiryFilterSchema, sendBulkEmailSchema };
export default {
  createEnquirySchema,
  updateEnquirySchema,
  enquiryFilterSchema,
  sendBulkEmailSchema,
};
