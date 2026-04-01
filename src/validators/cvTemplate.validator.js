import { z } from 'zod';

const uploadTemplateSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    course: z.string().min(1, 'Course is required'),
    experienceLevel: z.enum(['FRESHER', 'EXPERIENCED'], {
      errorMap: () => ({ message: 'Experience level must be FRESHER or EXPERIENCED' }),
    }),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export { uploadTemplateSchema };
export default { uploadTemplateSchema };
