import { config } from "@authcore/config";
import { asOrganizationId, asSessionId, asUserId } from "@authcore/database";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import type { AccessTokenPayload } from "../modules/auth/auth.types.js";

export function validateAccessToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw new Error("Authorization header not provided");
  }

  const [scheme, token, ...extra] = authorization.trim().split(/\s+/);

  if (scheme !== "Bearer" || !token || extra.length > 0) {
    throw new Error("Invalid authorization header");
  }

  const decoded = jwt.verify(token, config.auth.jwtPublicKey, {
    algorithms: ["RS256"],
    issuer: config.auth.jwtIssuer,
  });

  if (typeof decoded === "string") {
    throw new Error("Invalid access token");
  }

  const payload = decoded;

  if (
    typeof payload.sub !== "string" ||
    typeof payload.sid !== "string" ||
    typeof payload.orgId !== "string" ||
    typeof payload.jti !== "string" ||
    payload.type !== "access"
  ) {
    throw new Error("Invalid access token payload");
  }

  const accessToken: AccessTokenPayload = {
    sub: asUserId(payload.sub),
    sid: asSessionId(payload.sid),
    orgId: asOrganizationId(payload.orgId),
    jti: payload.jti,
    type: "access",
  };

  req.token = accessToken;

  next();
}
