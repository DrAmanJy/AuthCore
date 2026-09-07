import { Types } from "mongoose";
import { SessionRepository } from "./session.repository.js";
import {
  CreateSessionData,
  Device,
  OrganizationId,
  Session,
  SessionId,
  UpdateSessionData,
  UserId,
} from "./session.types.js";
import SessionModel from "../../models/session.model.js";
import { mapDatabaseError } from "../../errors/database-error.utils.js";

type ObjectId = Types.ObjectId;

type MongoSessionRecord = {
  _id: ObjectId;

  userId: ObjectId;
  organizationId: ObjectId;

  refreshTokenHash: string;

  device: Device;

  lastUsedAt: Date;
  expiresAt: Date;

  revokedAt?: Date;
  revokedReason?: string;

  createdAt: Date;
  updatedAt: Date;
};

export class MongoSessionRepository implements SessionRepository {
  async create(data: CreateSessionData): Promise<Session> {
    try {
      const session = await SessionModel.create(data).lean().exec();

      return this.toSessionType(session);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findById(sessionId: SessionId): Promise<Session | null> {
    const objectId = this.toObjectId(sessionId);
    if (!objectId) {
      return null;
    }

    const session = await SessionModel.findOne(objectId).lean().exec();
    return this.toSessionType(session);
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<Session | null> {}

  async findByUserId(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<Session[]> {}

  async findActiveByUserId(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<Session[]> {}

  async updateLastUsedAt(
    sessionId: SessionId,
    lastUsedAt: Date,
  ): Promise<Session | null> {}

  async updateRefreshToken(
    sessionId: SessionId,
    data: UpdateSessionData,
  ): Promise<Session | null> {}

  async revoke(sessionId: SessionId, reason?: string): Promise<Session | null> {}

  async revokeAllByUserId(
    userId: UserId,
    organizationId: OrganizationId,
    reason?: string,
  ): Promise<number> {}

  async revokeAllExcept(
    userId: UserId,
    organizationId: OrganizationId,
    sessionId: SessionId,
    reason?: string,
  ): Promise<number> {}

  async deleteById(sessionId: SessionId): Promise<boolean> {}

  private toObjectId(id: string): Types.ObjectId | null {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return new Types.ObjectId(id);
  }

  private toSessionType(record: MongoSessionRecord): Session {
    return {
      id: record._id.toString(),
      userId: record.userId.toString(),
      organizationId: record.organizationId.toString(),
      refreshTokenHash: record.refreshTokenHash,
      device: record.device,
      lastUsedAt: record.lastUsedAt,
      expiresAt: record.expiresAt,
      ...(record.revokedAt !== undefined && {
        lastLoginAt: record.revokedAt,
      }),
      ...(record.revokedReason !== undefined && {
        revokedReason: record.revokedReason,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
