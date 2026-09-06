import { z } from "zod";

export const idSchema = z.string("ID must be a string").trim().min(1, "ID is required");
