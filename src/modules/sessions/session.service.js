import { AppError } from "../../utils/AppError.js";
import Sessions from "./session.model.js";
import { createSessionToken, hashSessionToken } from "./session.utils.js";

export async function createSession(
  userId,
  serviceId,
  device,
  ipAddress,
  userAgent,
  tokenVersion = 1
) {
  try {
    const plainToken = createSessionToken();
    const refreshTokenHash = hashSessionToken(plainToken);

    const session = await Sessions.create({
      userId,
      serviceId,
      refreshTokenHash,
      device,
      ipAddress,
      userAgent,
      tokenVersion,
    });

    return {
      plainToken,
      userId: session.userId,
      serviceId: session.serviceId,
    };
  } catch (error) {
    console.error("Database Error while creating session:", error);
    throw new AppError("Error while creating session", 500);
  }
}
