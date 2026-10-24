import type { NextFunction, Request, Response } from "express";
import { AuthenticationError } from "../errors/authentication-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { config } from "@authcore/config";

export function validateServiceToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const serviceToken = req.headers["x-service-token"] ?? req.headers["authorization"];

  if (!serviceToken || typeof serviceToken !== "string") {
    throw new AuthenticationError(ERROR_CODES.AUTHORIZATION_HEADER_MISSING);
  }

  const rawToken = serviceToken.startsWith("Bearer ") ? serviceToken.slice(7) : serviceToken;

  if (rawToken !== config.auth.internalServiceSecret) {
    throw new AuthenticationError(ERROR_CODES.AUTH_UNAUTHORIZED);
  }

  next();
}
