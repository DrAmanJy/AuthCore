import { z } from "zod";

export const emailSchema = z
  .email("Please provide a valid email address")
  .trim()
  .toLowerCase()
  .max(255, "Email cannot exceed 255 characters");

export const dateSchema = z.coerce.date({
  error: issue =>
    issue.input === undefined ? "Date is required" : "Please provide a valid date",
});
