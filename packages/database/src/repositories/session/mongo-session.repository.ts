import type { Types, QueryFilter } from "mongoose";

import { toObjectId } from "../../utils/object-id.utils.js";
import { mapDatabaseError } from "../../errors/database-error.utils.js";
import SessionModel, { type ISession } from "../../models/session.model.js";

import type { SessionRepository } from "./session.repository.js";
import type {
  FindManyOptions,
  PaginatedResult,
} from "../repository-pagination.types.js";
import {
  asSessionId,
  type CreateSessionData,
  type FindManySessionsCriteria,
  type FindSessionCriteria,
  type RevokeSessionCriteria,
  type Session,
  type SessionId,
  type UpdateSessionData,
} from "./session.types.js";
import { asUserId, type UserId } from "../user/user.types.js";
import {
  asOrganizationId,
  type OrganizationId,
} from "../organization/organization.types.js";

type MongoSessionRecord = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  device: ISession["device"];
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  revokedReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

export class MongoSessionRepository implements SessionRepository {
  async find(criteria: FindSessionCriteria): Promise<Session | null> {
    try {
      const filter: QueryFilter<ISession> = {
        _id: toObjectId(criteria.sessionId),
      };

      if (criteria.organizationId) {
        filter.organizationId = toObjectId(criteria.organizationId);
      }

      const session = await SessionModel.findOne(filter)
        .lean<MongoSessionRecord>()
        .exec();

      return session ? this.toSessionType(session) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findMany(
    criteria: FindManySessionsCriteria,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<Session>> {
    try {
      const limit = Math.max(1, Math.min(options?.limit ?? 50, 100));

      const filter: QueryFilter<ISession> = {
        userId: toObjectId(criteria.userId),
      };

      if (criteria.organizationId) {
        filter.organizationId = toObjectId(criteria.organizationId);
      }

      if (criteria.activeOnly) {
        filter.revokedAt = { $exists: false };
        filter.expiresAt = { $gt: new Date() };
      }

      if (options?.cursor) {
        filter._id = { $gt: toObjectId(options.cursor) };
      }

      const records = await SessionModel.find(filter)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .lean<MongoSessionRecord[]>()
        .exec();

      const hasNextPage = records.length > limit;
      const pagedRecords = hasNextPage ? records.slice(0, limit) : records;
      const sessions = pagedRecords.map(record => this.toSessionType(record));
      const nextCursor = hasNextPage ? (sessions.at(-1)?.id ?? null) : null;

      return {
        items: sessions,
        nextCursor,
      };
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async create(data: CreateSessionData): Promise<Session> {
    try {
      const session = await SessionModel.create({
        userId: toObjectId(data.userId),
        organizationId: toObjectId(data.organizationId),
        device: data.device,
        expiresAt: data.expiresAt,
        ...(data.lastUsedAt && { lastUsedAt: data.lastUsedAt }),
      });

      return this.toSessionType(session);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async update(
    sessionId: SessionId,
    data: UpdateSessionData,
  ): Promise<Session | null> {
    try {
      const session = await SessionModel.findByIdAndUpdate(
        toObjectId(sessionId),
        { $set: data },
        {
          new: true,
          runValidators: true,
        },
      )
        .lean<MongoSessionRecord>()
        .exec();

      return session ? this.toSessionType(session) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async revoke(criteria: RevokeSessionCriteria): Promise<Session | null> {
    try {
      const filter: QueryFilter<ISession> = {
        _id: toObjectId(criteria.sessionId),
        revokedAt: { $exists: false },
      };

      if (criteria.userId) {
        filter.userId = toObjectId(criteria.userId);
      }

      if (criteria.organizationId) {
        filter.organizationId = toObjectId(criteria.organizationId);
      }

      const session = await SessionModel.findOneAndUpdate(
        filter,
        { $set: this.buildRevokeUpdate(criteria.reason) },
        {
          new: true,
          runValidators: true,
        },
      )
        .lean<MongoSessionRecord>()
        .exec();

      return session ? this.toSessionType(session) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async revokeAllByUserId(
    userId: UserId,
    organizationId?: OrganizationId,
    reason?: string,
  ): Promise<number> {
    try {
      const filter: QueryFilter<ISession> = {
        userId: toObjectId(userId),
        revokedAt: { $exists: false },
      };

      if (organizationId) {
        filter.organizationId = toObjectId(organizationId);
      }

      const result = await SessionModel.updateMany(filter, {
        $set: this.buildRevokeUpdate(reason),
      }).exec();

      return result.modifiedCount;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async revokeAllExcept(
    userId: UserId,
    organizationId: OrganizationId,
    sessionId: SessionId,
    reason?: string,
  ): Promise<number> {
    try {
      const result = await SessionModel.updateMany(
        {
          userId: toObjectId(userId),
          organizationId: toObjectId(organizationId),
          _id: { $ne: toObjectId(sessionId) },
          revokedAt: { $exists: false },
        },
        {
          $set: this.buildRevokeUpdate(reason),
        },
      ).exec();

      return result.modifiedCount;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  private buildRevokeUpdate(reason?: string) {
    return {
      revokedAt: new Date(),
      ...(reason !== undefined && { revokedReason: reason }),
    };
  }

  private toSessionType(record: MongoSessionRecord): Session {
    return {
      id: asSessionId(record._id.toString()),
      userId: asUserId(record.userId.toString()),
      organizationId: asOrganizationId(record.organizationId.toString()),
      device: record.device,
      lastUsedAt: record.lastUsedAt,
      expiresAt: record.expiresAt,
      ...(record.revokedAt !== undefined && {
        revokedAt: record.revokedAt,
      }),
      ...(record.revokedReason !== undefined && {
        revokedReason: record.revokedReason,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
