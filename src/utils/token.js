import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createAccessToken = (sub, sid, aud) =>
  jwt.sign(
    { sub: sub.toString(), sid: sid.toString(), aud },
    env.JWT_ACCESS_PRIVATE_KEY,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN, algorithm: "RS256", issuer: env.JWT_ISSUER }
  );
