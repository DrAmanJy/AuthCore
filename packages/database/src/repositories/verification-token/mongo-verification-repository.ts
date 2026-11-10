import type { Types, QueryFilter } from "mongoose";

import {
  VerificationTokenModel,
  type VerificationTokenDocument,
} from "../../models/verification-token.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import { mapDatabaseError } from "../../errors/database-error.utils.js";
import { asUserId } from "../user/user.types.js";
import type { VerificationTokenRepository } from "./verification-repository.js";
import type {
  FindManyOptions,
  PaginatedResult,
} from "../repository-pagination.types.js";
import {
  asVerificationTokenHash,
  asVerificationTokenId,
  type CreateVerificationTokenData,
  type DeleteVerificationTokenCriteria,
  type FindManyVerificationTokensCriteria,
  type FindVerificationTokenCriteria,
  type VerificationToken,
  type VerificationTokenId,
  type VerificationTokenType,
} from "./verification-token.types.js";

type MongoVerificationToken = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: VerificationTokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class MongoVerificationTokenRepository
  implements VerificationTokenRepository
{
  async find(
    criteria: FindVerificationTokenCriteria,
  ): Promise<VerificationToken | null> {
    try {
      if (criteria.by === "id") {
        const record = await VerificationTokenModel.findById(
          toObjectId(criteria.tokenId),
        )
          .lean<MongoVerificationToken>()
          .exec();

        return record ? this.toVerificationToken(record) : null;
      }

      const record = await VerificationTokenModel.findOne({
        tokenHash: criteria.tokenHash,
      })
        .lean<MongoVerificationToken>()
        .exec();

      return record ? this.toVerificationToken(record) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findMany(
    criteria: FindManyVerificationTokensCriteria,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<VerificationToken>> {
    try {
      const limit = Math.max(1, Math.min(options?.limit ?? 50, 100));

      const filter: QueryFilter<VerificationTokenDocument> = {
        userId: toObjectId(criteria.userId),
      };

      if (criteria.tokenType) {
        filter.type = criteria.tokenType;
      }

      if (criteria.unusedOnly) {
        filter.usedAt = { $exists: false };
        filter.expiresAt = { $gt: new Date() };
      }

      if (options?.cursor) {
        filter._id = { $gt: toObjectId(options.cursor) };
      }

      const records = await VerificationTokenModel.find(filter)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .lean<MongoVerificationToken[]>()
        .exec();

      const hasNextPage = records.length > limit;
      const pagedRecords = hasNextPage ? records.slice(0, limit) : records;
      const tokens = pagedRecords.map(record => this.toVerificationToken(record));
      const nextCursor = hasNextPage ? (tokens.at(-1)?.id ?? null) : null;

      return {
        items: tokens,
        nextCursor,
      };
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async create(data: CreateVerificationTokenData): Promise<VerificationToken> {
    try {
      const record = await VerificationTokenModel.create({
        userId: toObjectId(data.userId),
        type: data.type,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      });

      return this.toVerificationToken(record);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async markAsUsed(
    tokenId: VerificationTokenId,
    usedAt: Date = new Date(),
  ): Promise<VerificationToken | null> {
    try {
      const record = await VerificationTokenModel.findOneAndUpdate(
        {
          _id: toObjectId(tokenId),
          usedAt: { $exists: false },
        },
        {
          $set: { usedAt },
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .lean<MongoVerificationToken>()
        .exec();

      return record ? this.toVerificationToken(record) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async delete(criteria: DeleteVerificationTokenCriteria): Promise<boolean> {
    try {
      switch (criteria.by) {
        case "id": {
          const result = await VerificationTokenModel.deleteOne({
            _id: toObjectId(criteria.tokenId),
          }).exec();

          return result.deletedCount > 0;
        }

        case "hash": {
          const result = await VerificationTokenModel.deleteOne({
            tokenHash: criteria.tokenHash,
          }).exec();

          return result.deletedCount > 0;
        }

        case "user": {
          const filter: QueryFilter<VerificationTokenDocument> = {
            userId: toObjectId(criteria.userId),
          };

          if (criteria.tokenType) {
            filter.type = criteria.tokenType;
          }

          const result = await VerificationTokenModel.deleteMany(filter).exec();

          return result.deletedCount > 0;
        }
      }
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async deleteExpired(before: Date = new Date()): Promise<number> {
    try {
      const result = await VerificationTokenModel.deleteMany({
        expiresAt: {
          $lt: before,
        },
      }).exec();

      return result.deletedCount;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  private toVerificationToken(
    record: MongoVerificationToken,
  ): VerificationToken {
    return {
      id: asVerificationTokenId(record._id.toString()),
      userId: asUserId(record.userId.toString()),
      type: record.type,
      tokenHash: asVerificationTokenHash(record.tokenHash),
      expiresAt: record.expiresAt,
      ...(record.usedAt && {
        usedAt: record.usedAt,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
