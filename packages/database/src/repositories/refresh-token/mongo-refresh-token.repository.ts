import type { Types, QueryFilter } from "mongoose";

import { RefreshTokenModel, type RefreshTokenDocument } from "../../models/refresh-token.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import { mapDatabaseError } from "../../errors/database-error.utils.js";
import { asSessionId, type SessionId } from "../session/session.types.js";
import type { RefreshTokenRepository } from "./refresh-token.repository.js";
import type {
  FindManyOptions,
  PaginatedResult,
} from "../repository-pagination.types.js";
import {
  asRefreshTokenHash,
  asRefreshTokenId,
  asTokenFamilyId,
  type CreateRefreshTokenData,
  type FindManyRefreshTokensCriteria,
  type FindRefreshTokenCriteria,
  type RefreshTokenId,
  type RefreshTokenRecord,
  type TokenFamilyId,
} from "./refresh-token.types.js";

type MongoRefreshTokenRecord = {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  tokenHash: string;
  tokenFamilyId: string;
  parentTokenId?: Types.ObjectId;
  expiresAt: Date;
  usedAt?: Date;
  revokedAt?: Date;
  reuseDetected: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class MongoRefreshTokenRepository implements RefreshTokenRepository {
  async find(criteria: FindRefreshTokenCriteria): Promise<RefreshTokenRecord | null> {
    try {
      if (criteria.by === "id") {
        const record = await RefreshTokenModel.findById(toObjectId(criteria.refreshTokenId))
          .lean<MongoRefreshTokenRecord>()
          .exec();

        return record ? this.toRefreshTokenRecord(record) : null;
      }

      const filter: QueryFilter<RefreshTokenDocument> = {
        tokenHash: criteria.tokenHash,
      };

      if (criteria.activeOnly) {
        filter.usedAt = { $exists: false };
        filter.revokedAt = { $exists: false };
        filter.expiresAt = { $gt: new Date() };
      }

      const record = await RefreshTokenModel.findOne(filter)
        .lean<MongoRefreshTokenRecord>()
        .exec();

      return record ? this.toRefreshTokenRecord(record) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findMany(
    criteria: FindManyRefreshTokensCriteria,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<RefreshTokenRecord>> {
    try {
      const limit = Math.max(1, Math.min(options?.limit ?? 50, 100));

      const filter: QueryFilter<RefreshTokenDocument> = {};

      if (criteria.tokenFamilyId) {
        filter.tokenFamilyId = criteria.tokenFamilyId;
      }

      if (criteria.sessionId) {
        filter.sessionId = toObjectId(criteria.sessionId);
      }

      if (options?.cursor) {
        filter._id = { $gt: toObjectId(options.cursor) };
      }

      const records = await RefreshTokenModel.find(filter)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .lean<MongoRefreshTokenRecord[]>()
        .exec();

      const hasNextPage = records.length > limit;
      const pagedRecords = hasNextPage ? records.slice(0, limit) : records;
      const tokens = pagedRecords.map(record => this.toRefreshTokenRecord(record));
      const nextCursor = hasNextPage ? (tokens.at(-1)?.id ?? null) : null;

      return {
        items: tokens,
        nextCursor,
      };
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async create(data: CreateRefreshTokenData): Promise<RefreshTokenRecord> {
    try {
      const record = await RefreshTokenModel.create({
        sessionId: toObjectId(data.sessionId),
        tokenHash: data.tokenHash,
        tokenFamilyId: data.tokenFamilyId,
        ...(data.parentTokenId && {
          parentTokenId: toObjectId(data.parentTokenId),
        }),
        expiresAt: data.expiresAt,
      });

      return this.toRefreshTokenRecord(record);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async consumeIfUnused(
    refreshTokenId: RefreshTokenId,
    consumedAt: Date = new Date(),
  ): Promise<RefreshTokenRecord | null> {
    try {
      const record = await RefreshTokenModel.findOneAndUpdate(
        {
          _id: toObjectId(refreshTokenId),
          usedAt: { $exists: false },
          revokedAt: { $exists: false },
          expiresAt: { $gt: consumedAt },
        },
        {
          $set: {
            usedAt: consumedAt,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .lean<MongoRefreshTokenRecord>()
        .exec();

      return record ? this.toRefreshTokenRecord(record) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async markAsUsed(
    refreshTokenId: RefreshTokenId,
    usedAt: Date = new Date(),
  ): Promise<RefreshTokenRecord | null> {
    try {
      const record = await RefreshTokenModel.findByIdAndUpdate(
        toObjectId(refreshTokenId),
        {
          $set: {
            usedAt,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .lean<MongoRefreshTokenRecord>()
        .exec();

      return record ? this.toRefreshTokenRecord(record) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async markReuseDetected(
    refreshTokenId: RefreshTokenId,
  ): Promise<RefreshTokenRecord | null> {
    try {
      const record = await RefreshTokenModel.findByIdAndUpdate(
        toObjectId(refreshTokenId),
        {
          $set: {
            reuseDetected: true,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .lean<MongoRefreshTokenRecord>()
        .exec();

      return record ? this.toRefreshTokenRecord(record) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async revoke(
    refreshTokenId: RefreshTokenId,
    revokedAt: Date = new Date(),
  ): Promise<RefreshTokenRecord | null> {
    try {
      const record = await RefreshTokenModel.findByIdAndUpdate(
        toObjectId(refreshTokenId),
        {
          $set: {
            revokedAt,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .lean<MongoRefreshTokenRecord>()
        .exec();

      return record ? this.toRefreshTokenRecord(record) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async revokeFamily(
    tokenFamilyId: TokenFamilyId,
    revokedAt: Date = new Date(),
  ): Promise<number> {
    try {
      const result = await RefreshTokenModel.updateMany(
        {
          tokenFamilyId,
        },
        {
          $set: {
            revokedAt,
            reuseDetected: true,
          },
        },
      ).exec();

      return result.modifiedCount;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async revokeAllBySessionId(
    sessionId: SessionId,
    revokedAt: Date = new Date(),
  ): Promise<number> {
    try {
      const result = await RefreshTokenModel.updateMany(
        {
          sessionId: toObjectId(sessionId),
        },
        {
          $set: {
            revokedAt,
          },
        },
      ).exec();

      return result.modifiedCount;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async deleteExpired(before: Date = new Date()): Promise<number> {
    try {
      const result = await RefreshTokenModel.deleteMany({
        expiresAt: {
          $lt: before,
        },
      }).exec();

      return result.deletedCount;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  private toRefreshTokenRecord(record: MongoRefreshTokenRecord): RefreshTokenRecord {
    return {
      id: asRefreshTokenId(record._id.toString()),
      sessionId: asSessionId(record.sessionId.toString()),
      tokenHash: asRefreshTokenHash(record.tokenHash),
      tokenFamilyId: asTokenFamilyId(record.tokenFamilyId),
      ...(record.parentTokenId && {
        parentTokenId: asRefreshTokenId(record.parentTokenId.toString()),
      }),
      ...(record.usedAt && {
        usedAt: record.usedAt,
      }),
      ...(record.revokedAt && {
        revokedAt: record.revokedAt,
      }),
      expiresAt: record.expiresAt,
      reuseDetected: record.reuseDetected,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
