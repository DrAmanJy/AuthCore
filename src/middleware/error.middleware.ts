import { ZodError } from "zod";
import { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

type ErrorResponse = {
  status: "error";
  error: {
    message: string;
    stack?: string;
  };
};

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  if (res.headersSent) {
    return next(error);
  }

  const isProd = env.NODE_ENV === "production";

  let statusCode = 500;
  let message = "Something went wrong on the server";

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  if (error instanceof ZodError) {
    statusCode = 400;

    const firstIssue = error.issues[0];

    message = firstIssue?.message || "Invalid input data";
  }

  console.error({
    path: req.path,
    method: req.method,
    statusCode,
    err: error,
  });

  const responseBody: ErrorResponse = {
    status: "error",
    error: {
      message,
    },
  };

  if (!isProd && error instanceof Error && error.stack) {
    responseBody.error.stack = error.stack;
  }

  return res.status(statusCode).json(responseBody);
};
