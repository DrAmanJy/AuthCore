import type { Types } from "mongoose";

import { RefreshTokenModel } from "../../models/refresh-token.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import { asSessionId, type SessionId } from "../session/session.types.js";
import type { RefreshTokenRepository } from "./refresh-token.repository.js";
import {
  asRefreshTokenHash,
  asRefreshTokenId,
  asTokenFamilyId,
  type CreateRefreshTokenData,
  type RefreshTokenHash,
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
  async findById(refreshTokenId: RefreshTokenId): Promise<RefreshTokenRecord | null> {
    const record = await RefreshTokenModel.findById(toObjectId(refreshTokenId))
      .lean<MongoRefreshTokenRecord>()
      .exec();

    return record ? this.toRefreshTokenRecord(record) : null;
  }

  async findByHash(tokenHash: RefreshTokenHash): Promise<RefreshTokenRecord | null> {
    const record = await RefreshTokenModel.findOne({ tokenHash })
      .lean<MongoRefreshTokenRecord>()
      .exec();

    return record ? this.toRefreshTokenRecord(record) : null;
  }

  async findFamily(tokenFamilyId: TokenFamilyId): Promise<RefreshTokenRecord[]> {
    const records = await RefreshTokenModel.find({
      tokenFamilyId,
    })
      .lean<MongoRefreshTokenRecord[]>()
      .exec();

    return records.map(record => this.toRefreshTokenRecord(record));
  }

  async create(data: CreateRefreshTokenData): Promise<RefreshTokenRecord> {
    const record = await RefreshTokenModel.create(data);

    return this.toRefreshTokenRecord(record);
  }

  async markAsUsed(
    refreshTokenId: RefreshTokenId,
    usedAt: Date = new Date(),
  ): Promise<RefreshTokenRecord | null> {
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
  }

  async revoke(
    refreshTokenId: RefreshTokenId,
    revokedAt: Date = new Date(),
  ): Promise<RefreshTokenRecord | null> {
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
  }

  async markReuseDetected(
    refreshTokenId: RefreshTokenId,
  ): Promise<RefreshTokenRecord | null> {
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
  }

  async revokeFamily(
    tokenFamilyId: TokenFamilyId,
    revokedAt: Date = new Date(),
  ): Promise<number> {
    const result = await RefreshTokenModel.updateMany(
      {
        tokenFamilyId,
      },
      {
        $set: {
          revokedAt,
        },
      },
    ).exec();

    return result.modifiedCount;
  }

  async revokeAllBySessionId(
    sessionId: SessionId,
    revokedAt: Date = new Date(),
  ): Promise<number> {
    const objectId = toObjectId(sessionId);

    const result = await RefreshTokenModel.updateMany(
      {
        sessionId: objectId,
      },
      {
        $set: {
          revokedAt,
        },
      },
    ).exec();

    return result.modifiedCount;
  }

  async deleteExpired(before: Date = new Date()): Promise<number> {
    const result = await RefreshTokenModel.deleteMany({
      expiresAt: {
        $lt: before,
      },
    }).exec();

    return result.deletedCount;
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
