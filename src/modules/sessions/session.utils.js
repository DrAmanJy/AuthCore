import crypto from "crypto";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";

export const createSessionToken = () => {
  try {
    const buf = crypto.randomBytes(env.REFRESH_TOKEN_BYTES);
    return buf.toString("hex");
  } catch (_) {
    throw new AppError("Failed to create refresh token", 500);
  }
};

export const hashSessionToken = sessionToken => {
  try {
    return crypto.createHash("sha256").update(sessionToken).digest("hex");
  } catch (_) {
    throw new AppError("Failed to hash session token", 500);
  }
};

export const compareSessionToken = (plainToken, hashToken) => {
  try {
    const newHash = crypto.createHash("sha256").update(plainToken).digest("hex");

    const newHashBuffer = Buffer.from(newHash);
    const dbHashBuffer = Buffer.from(hashToken);

    if (newHashBuffer.length !== dbHashBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(newHashBuffer, dbHashBuffer);
  } catch (_) {
    return false;
  }
};
