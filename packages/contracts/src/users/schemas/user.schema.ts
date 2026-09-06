import { z } from "zod";

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Display name must be at least 2 characters")
  .max(50, "Display name cannot exceed 50 characters");

export const emailSchema = z
  .email("Please provide a valid email address")
  .trim()
  .toLowerCase()
  .max(255, "Email cannot exceed 255 characters");

export const userStatusSchema = z.enum([
  "pending",
  "active",
  "suspended",
  "inactive",
  "deactivated",
]);
