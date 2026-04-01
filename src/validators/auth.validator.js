import { z } from "zod";

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email() }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const resetPasswordSchema = z.object({
  body: z.object({ token: z.string().min(10), password: z.string().min(6) }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
export default {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
