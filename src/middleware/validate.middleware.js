import { isValidObjectId } from "mongoose";
import { AppError } from "../utils/AppError.js";

export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    req[source] = schema.parse(req[source]);
    next();
  };

export const validateId =
  (source = "id") =>
  (req, res, next) => {
    const id = req.params[source];
    if (!isValidObjectId(id)) throw new AppError("Invalid ID format", 400);
    next();
  };
