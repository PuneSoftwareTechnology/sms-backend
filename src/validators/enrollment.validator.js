import { z  } from 'zod';
const convertEnquirySchema = z.object({
  body: z.object({
    enquiryId: z.number().int().positive(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
    course: z.string().min(2),
    totalFee: z.number().positive(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export {
convertEnquirySchema,
};

export default {
convertEnquirySchema,
};
