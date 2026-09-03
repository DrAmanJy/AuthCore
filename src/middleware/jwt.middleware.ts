import jwt, { type JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

type AccessTokenPayload = JwtPayload & {
  sub: string;
  sid: string;
  aud: string;
};

export const verifyAccessToken = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Not authorized, no token provided", 401);
  }

  const accessToken = authHeader.split(" ")[1];

  if (!accessToken) {
    throw new AppError("Invalid token format", 401);
  }

  let decoded: string | JwtPayload;

  try {
    decoded = jwt.verify(accessToken, env.JWT_ACCESS_PUBLIC_KEY, {
      algorithms: ["RS256"],
    });
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }

  if (
    typeof decoded === "string" ||
    typeof decoded.sub !== "string" ||
    typeof decoded.sid !== "string" ||
    typeof decoded.aud !== "string"
  ) {
    throw new AppError("Invalid access token payload", 401);
  }

  req.accessToken = {
    sub: decoded.sub,
    sid: decoded.sid,
    aud: decoded.aud,
  };

  next();
};
