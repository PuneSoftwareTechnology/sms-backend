import { z } from "zod";

const enquiryBody = z.object({
  enquiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional(),
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional(),
  course: z.string().optional(),
  institute: z.string().optional(),
  leadStatus: z.string().optional(),
  demoStatus: z.string().optional(),
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
  }),
});

export { createEnquirySchema, updateEnquirySchema, enquiryFilterSchema };
export default {
  createEnquirySchema,
  updateEnquirySchema,
  enquiryFilterSchema,
};
