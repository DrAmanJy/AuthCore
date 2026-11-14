import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { ERROR_CODES } from "../errors/error-codes.js";

import { config } from "@authcore/config";
import { asOrganizationId, asSessionId, asUserId } from "@authcore/database";
import type { AccessTokenPayload } from "../modules/auth/auth.types.js";
import { authorizationService, sessionService } from "../container.js";
import { AppError } from "../errors/app-error.js";

export async function validateAccessToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw new AppError(ERROR_CODES.AUTH_HEADER_MISSING);
  }

  const [scheme, token, ...extra] = authorization.trim().split(/\s+/);

  if (scheme !== "Bearer" || !token || extra.length > 0) {
    throw new AppError(ERROR_CODES.AUTH_HEADER_INVALID);
  }

  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(token, config.auth.jwtPublicKey, {
      algorithms: ["RS256"],
      issuer: config.auth.jwtIssuer,
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(ERROR_CODES.AUTH_TOKEN_EXPIRED, {
        cause: error,
      });
    }

    throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN, {
      cause: error,
    });
  }

  if (typeof decoded === "string") {
    throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN);
  }

  if (
    typeof decoded.sub !== "string" ||
    typeof decoded.sid !== "string" ||
    typeof decoded.orgId !== "string" ||
    typeof decoded.jti !== "string" ||
    decoded.type !== "access"
  ) {
    throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN);
  }

  const accessToken: AccessTokenPayload = {
    sub: asUserId(decoded.sub),
    sid: asSessionId(decoded.sid),
    orgId: asOrganizationId(decoded.orgId),
    jti: decoded.jti,
    type: "access",
  };

  const session = await sessionService.getSessionById(accessToken.sid);

  if (!session) throw new AppError("AUTH_SESSION_NOT_FOUND");
  if (session.revokedAt) throw new AppError("AUTH_SESSION_REVOKED");
  if (session.expiresAt < new Date()) throw new AppError("AUTH_SESSION_EXPIRED");
  if (session.userId !== decoded.sub || session.organizationId !== decoded.orgId)
    throw new AppError("AUTH_INVALID_TOKEN");

  req.token = accessToken;

  next();
}

export async function validateApiToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization = req.get("authorization");

    if (!authorization) {
      throw new AppError(ERROR_CODES.AUTH_HEADER_MISSING);
    }

    const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());

    if (!match?.[1]) {
      throw new AppError(ERROR_CODES.AUTH_HEADER_INVALID);
    }

    const apiKey = await authorizationService.getByKey(match[1]);

    if (apiKey.status !== "active") {
      throw new AppError(ERROR_CODES.API_KEY_REVOKED);
    }

    req.apiKey = apiKey;

    next();
  } catch (error: unknown) {
    next(error);
  }
}
