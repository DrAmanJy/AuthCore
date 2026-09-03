import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";

export const extractServiceIdentity = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const targetAudience = req.headers["x-target-audience"];

  if (!targetAudience) {
    throw new AppError("Bad Request: Missing 'x-target-audience' header", 400);
  }

  req.service = {
    name: targetAudience,
  };

  next();
};
