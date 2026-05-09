import { z } from "zod";

export const validateUserSchema = z.object({
  fullname: z
    .string()
    .min(5, "Fullname must be at least 5 characters")
    .max(16, "Fullname cannot exceed 16 characters")
    .optional(),

  email: z.string().email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 6 characters")
    .max(32, "Password cannot exceed 32 characters"),
});
