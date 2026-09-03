import { HydratedDocument, Types } from "mongoose";
import { AppError } from "../../utils/AppError.js";
import SessionsModel, { Session, Device } from "./session.model.js";
import { createSessionToken, hashSessionToken } from "./session.utils.js";

type CreateSessionInput = {
  userId: Types.ObjectId;
  serviceId: string;
  device: Device;
  ipAddress: string;
  userAgent: string;
};

type SessionTokenResult = {
  plainToken: string;
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
};

type SessionDocument = HydratedDocument<Session>;

export async function createSession({
  userId,
  serviceId,
  device,
  ipAddress,
  userAgent,
}: CreateSessionInput): Promise<SessionTokenResult> {
  try {
    const plainToken = createSessionToken();
    const refreshTokenHash = hashSessionToken(plainToken);

    const session = await SessionsModel.create({
      userId,
      serviceId,
      refreshTokenHash,
      device,
      ipAddress,
      userAgent,
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

export async function rotateSession(plainToken: string): Promise<SessionTokenResult> {
  try {
    const refreshTokenHash = hashSessionToken(plainToken);
    const session = await SessionsModel.findOne({ refreshTokenHash });

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
    session.lastUsedAt = new Date();
    await session.save();

    return {
      plainToken: newPlainToken,
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

export async function revokeSession(sessionId: Types.ObjectId): Promise<boolean> {
  try {
    const revokedSession = await SessionsModel.findByIdAndUpdate(
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

export async function revokeAllSessions(userId: Types.ObjectId): Promise<boolean> {
  try {
    await SessionsModel.updateMany(
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

export async function findSessionById(
  sessionId: Types.ObjectId
): Promise<SessionDocument | null> {
  try {
    return await SessionsModel.findById(sessionId);
  } catch (error) {
    console.error("Database Error while getting session by ID:", error);
    return null;
  }
}

export async function findSessionByToken(plainToken: string): Promise<Session | null> {
  try {
    const refreshTokenHash = hashSessionToken(plainToken);
    return await SessionsModel.findOne({ refreshTokenHash });
  } catch (error) {
    console.error("Database Error while getting session by ID:", error);
    return null;
  }
}

export async function findUserSessions(userId: Types.ObjectId): Promise<Session[]> {
  try {
    return await SessionsModel.find({
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
