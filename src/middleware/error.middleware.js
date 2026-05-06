import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

export const errorHandler = (error, req, res, next) => {
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
    const firstIssue = error.issues?.[0];
    message =
      (typeof firstIssue?.message === "string" && firstIssue.message) ||
      "Invalid input data";
  }

  console.error({
    path: req.path,
    method: req.method,
    statusCode,
    err: error,
  });

  const responseBody = {
    status: "error",
    error: {
      message,
    },
  };

  if (!isProd && error instanceof Error && error.stack) {
    responseBody.error.stack = error.stack;
  }

  res.status(statusCode).json(responseBody);
};
