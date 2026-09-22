import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password cannot exceed 128 characters");

export const tokenSchema = z
  .string()
  .trim()
  .min(1, "Token is required");
