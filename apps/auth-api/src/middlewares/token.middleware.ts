import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { ERROR_CODES } from "../errors/error-codes.js";
import {
  AuthenticationError,
  TokenExpiredError,
} from "../errors/authentication-error.js";
import { config } from "@authcore/config";
import { asOrganizationId, asSessionId, asUserId } from "@authcore/database";
import type { AccessTokenPayload } from "../modules/auth/auth.types.js";
import { authorizationService } from "../modules/organization/organization.container.js";

export function validateAccessToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw new AuthenticationError(ERROR_CODES.AUTHORIZATION_HEADER_MISSING);
  }

  const [scheme, token, ...extra] = authorization.trim().split(/\s+/);

  if (scheme !== "Bearer" || !token || extra.length > 0) {
    throw new AuthenticationError(ERROR_CODES.AUTHORIZATION_HEADER_INVALID);
  }

  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(token, config.auth.jwtPublicKey, {
      algorithms: ["RS256"],
      issuer: config.auth.jwtIssuer,
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError(ERROR_CODES.AUTH_TOKEN_EXPIRED, error.expiredAt, {
        cause: error,
      });
    }

    throw new AuthenticationError(ERROR_CODES.AUTH_INVALID_TOKEN, {
      cause: error,
    });
  }

  if (typeof decoded === "string") {
    throw new AuthenticationError(ERROR_CODES.AUTH_INVALID_TOKEN);
  }

  if (
    typeof decoded.sub !== "string" ||
    typeof decoded.sid !== "string" ||
    typeof decoded.orgId !== "string" ||
    typeof decoded.jti !== "string" ||
    decoded.type !== "access"
  ) {
    throw new AuthenticationError(ERROR_CODES.AUTH_INVALID_TOKEN);
  }

  const accessToken: AccessTokenPayload = {
    sub: asUserId(decoded.sub),
    sid: asSessionId(decoded.sid),
    orgId: asOrganizationId(decoded.orgId),
    jti: decoded.jti,
    type: "access",
  };

  req.token = accessToken;
  req.user = { userId: accessToken.sub };

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
      throw new AuthenticationError(ERROR_CODES.AUTHORIZATION_HEADER_MISSING);
    }

    const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());

    if (!match?.[1]) {
      throw new AuthenticationError(ERROR_CODES.AUTHORIZATION_HEADER_INVALID);
    }

    const apiKey = await authorizationService.getByKey(match[1]);

    if (apiKey.status !== "active") {
      throw new AuthenticationError(ERROR_CODES.API_KEY_REVOKED);
    }

    req.apiKey = apiKey;

    next();
  } catch (error: unknown) {
    next(error);
  }
}
