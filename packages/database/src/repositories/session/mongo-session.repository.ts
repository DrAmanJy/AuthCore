import type { Types } from "mongoose";
import { type QueryFilter } from "mongoose";

import { toObjectId } from "../../utils/object-id.utils.js";

import type { SessionRepository } from "./session.repository.js";

import { asUserId, type UserId } from "../user/user.types.js";

import {
  asSessionId,
  type CreateSessionData,
  type FindSessionCriteria,
  type Session,
  type SessionId,
  type UpdateSessionData,
} from "./session.types.js";

import SessionModel, { type ISession } from "../../models/session.model.js";

import { mapDatabaseError } from "../../errors/database-error.utils.js";
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
  async findSession(
    criteria: Extract<FindSessionCriteria, { type: "id" }>,
  ): Promise<Session | null>;

  async findSession(
    criteria: Extract<FindSessionCriteria, { type: "refreshTokenHash" }>,
  ): Promise<Session | null>;

  async findSession(
    criteria: Extract<FindSessionCriteria, { type: "user" }>,
  ): Promise<Session[]>;

  async findSession(criteria: FindSessionCriteria): Promise<Session | Session[] | null> {
    try {
      switch (criteria.type) {
        case "id": {
          const sessionId = toObjectId(criteria.value);

          const session = await SessionModel.findById(sessionId)
            .select("+refreshTokenHash")
            .lean()
            .exec();

          return session ? this.toSessionType(session) : null;
        }

        case "user": {
          const userId = toObjectId(criteria.userId);

          const organizationId = toObjectId(criteria.organizationId);

          const filter: QueryFilter<ISession> = {
            userId,
            organizationId,
          };

          if (criteria.activeOnly) {
            filter.revokedAt = {
              $exists: false,
            };

            filter.expiresAt = {
              $gt: new Date(),
            };
          }

          const sessions = await SessionModel.find(filter)
            .select("+refreshTokenHash")
            .lean()
            .exec();

          return sessions.map(session => this.toSessionType(session));
        }
      }
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
      });

      return this.toSessionType(session);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async updateSession(
    sessionId: SessionId,
    data: UpdateSessionData,
  ): Promise<Session | null> {
    const objectId = toObjectId(sessionId);

    try {
      const session = await SessionModel.findByIdAndUpdate(
        objectId,
        {
          $set: data,
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .select("+refreshTokenHash")
        .lean()
        .exec();

      return session ? this.toSessionType(session) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async revoke(sessionId: SessionId, reason?: string): Promise<Session | null> {
    const objectId = toObjectId(sessionId);

    try {
      const session = await SessionModel.findOneAndUpdate(
        {
          _id: objectId,
          revokedAt: {
            $exists: false,
          },
        },
        {
          $set: this.buildRevokeUpdate(reason),
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .select("+refreshTokenHash")
        .lean()
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
    const filter = {
      userId: toObjectId(userId),
      ...(organizationId && {
        organizationId: toObjectId(organizationId),
      }),
      revokedAt: {
        $exists: false,
      },
    };

    try {
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
    const userObjectId = toObjectId(userId);

    const organizationObjectId = toObjectId(organizationId);

    const sessionObjectId = toObjectId(sessionId);

    try {
      const result = await SessionModel.updateMany(
        {
          userId: userObjectId,
          organizationId: organizationObjectId,

          _id: {
            $ne: sessionObjectId,
          },

          revokedAt: {
            $exists: false,
          },
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

      ...(reason !== undefined && {
        revokedReason: reason,
      }),
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
