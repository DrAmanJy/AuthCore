import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createAccessToken = (sub: string, sid: string, aud: string) => {
  return jwt.sign({ sub, sid, aud }, env.JWT_ACCESS_PRIVATE_KEY, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    algorithm: "RS256",
    issuer: env.JWT_ISSUER,
  });
};
