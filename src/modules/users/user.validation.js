import { z } from "zod";
import { emailField } from "../auth/auth.validation.js";

export const updateUserSchema = z
  .object({
    name: emailField,
  })
  .strict("You are only allowed to update permitted profile fields.");
