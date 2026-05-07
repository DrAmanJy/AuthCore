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
      sessionId: session._id,
    };
  } catch (error) {
    console.error("Database Error while creating session:", error);
    throw new AppError("Error while creating session", 500);
  }
}

export async function rotateSession(plainToken) {
  try {
    const refreshTokenHash = hashSessionToken(plainToken);
    const session = await Sessions.findOne({ refreshTokenHash });

    if (!session) {
      throw new AppError("Invalid session token", 401);
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw new AppError("Session has expired", 401);
    }

    if (session.revokedAt) {
      throw new AppError("Session has been revoked", 401);
    }

    const newPlainToken = createSessionToken();
    const newRefreshTokenHash = hashSessionToken(newPlainToken);

    session.refreshTokenHash = newRefreshTokenHash;
    session.lastUsedAt = Date.now();

    await session.save();

    return {
      newPlainToken,
      userId: session.userId,
      sessionId: session._id,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database Error while rotating session:", error);
    throw new AppError("Internal server error during rotation", 500);
  }
}

export async function revokeSession(sessionId) {
  try {
    const revokedSession = await Sessions.findByIdAndUpdate(
      sessionId,
      { revokedAt: new Date() },
      { new: true }
    );

    if (!revokedSession) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Database Error while revoking session:", error);
    return false;
  }
}

export async function revokeAllSessions(userId) {
  try {
    await Sessions.updateMany(
      {
        userId: userId,
        revokedAt: null,
      },
      {
        $set: { revokedAt: new Date() },
      }
    );
    return true;
  } catch (error) {
    console.error("Database Error while revoking all sessions:", error);
    return false;
  }
}

export async function findSessionById(sessionId) {
  try {
    return await Sessions.findById(sessionId);
  } catch (error) {
    console.error("Database Error while getting session by ID:", error);
    return null;
  }
}

export async function findSessionByToken(plainToken) {
  try {
    const refreshTokenHash = hashSessionToken(plainToken);
    return await Sessions.findOne({ refreshTokenHash });
  } catch (error) {
    console.error("Database Error while getting session by ID:", error);
    return null;
  }
}

export async function findUserSessions(userId) {
  try {
    return await Sessions.find({
      userId: userId,
      revokedAt: null,
    })
      .sort({ lastUsedAt: -1 })
      .populate("serviceId", "name");
  } catch (error) {
    console.error("Database Error while getting user sessions:", error);
    return [];
  }
}
