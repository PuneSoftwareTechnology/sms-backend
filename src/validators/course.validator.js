import { z } from "zod";

const createCourseSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Course name is required").max(150),
    isActive: z.boolean().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateCourseSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(150).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((d) => d.name !== undefined || d.isActive !== undefined, {
      message: "At least one field is required",
    }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export { createCourseSchema, updateCourseSchema };
export default { createCourseSchema, updateCourseSchema };
