import { z } from 'zod';

const dashboardStatsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    period: z.enum(['month', 'quarter', 'year', 'all', 'custom']).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

export { dashboardStatsSchema };
export default { dashboardStatsSchema };
