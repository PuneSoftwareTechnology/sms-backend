import { z } from 'zod';

const enquiryBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  course: z.string().optional(),
  leadStatus: z.string().optional(),
  demoStatus: z.string().optional(),
});

const createEnquirySchema = z.object({ body: enquiryBody, params: z.object({}).optional(), query: z.object({}).optional() });

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
export default { createEnquirySchema, updateEnquirySchema, enquiryFilterSchema };
