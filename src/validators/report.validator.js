import { z } from 'zod';

const candidateFilterReportSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    city: z.string().optional(),
    course: z.string().optional(),
    batch: z.string().optional(),
    minExperience: z.string().optional(),
    maxExperience: z.string().optional(),
    minTechnicalRating: z.string().optional(),
    minCommunicationRating: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const feeDueSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({ days: z.string().optional() }),
});

export { candidateFilterReportSchema, feeDueSchema };
export default { candidateFilterReportSchema, feeDueSchema };
