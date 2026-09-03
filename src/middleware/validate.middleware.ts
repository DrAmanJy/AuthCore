import { isValidObjectId } from "mongoose";
import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

import { AppError } from "../utils/AppError.js";

type ValidationSource = "body" | "query" | "params";

export const validate =
  (schema: ZodType, source: ValidationSource = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    req[source] = schema.parse(req[source]);
    next();
  };

export const validateId =
  (source = "id") =>
  (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[source];
    if (!isValidObjectId(id)) throw new AppError("Invalid ID format", 400);
    next();
  };
