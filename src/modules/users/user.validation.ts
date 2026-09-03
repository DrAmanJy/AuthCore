import { z } from "zod";
import { emailField } from "../auth/auth.validation.js";

export const updateUserSchema = z
  .object(
    {
      name: emailField,
    },
    {
      message: "You are only allowed to update permitted profile fields.",
    }
  )
  .strict();
