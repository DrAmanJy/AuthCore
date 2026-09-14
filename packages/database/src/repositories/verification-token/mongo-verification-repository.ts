import { Types } from "mongoose";

import { VerificationTokenModel } from "../../models/verification-token.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import { VerificationTokenRepository } from "./verification-repository.js";
import {
  CreateVerificationTokenData,
  DeleteVerificationTokenCriteria,
  FindVerificationTokenCriteria,
  VerificationToken,
  VerificationTokenId,
  VerificationTokenType,
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

export class MongoVerificationTokenRepository implements VerificationTokenRepository {
  async find(
    criteria: Extract<FindVerificationTokenCriteria, { type: "id" | "hash" }>,
  ): Promise<VerificationToken | null>;

  async find(
    criteria: Extract<FindVerificationTokenCriteria, { type: "user" }>,
  ): Promise<VerificationToken[]>;

  async find(
    criteria: FindVerificationTokenCriteria,
  ): Promise<VerificationToken | VerificationToken[] | null> {
    switch (criteria.type) {
      case "id": {
        const record = await VerificationTokenModel.findById(toObjectId(criteria.value))
          .lean<MongoVerificationToken>()
          .exec();

        return record ? this.toVerificationToken(record) : null;
      }

      case "hash": {
        const record = await VerificationTokenModel.findOne({
          tokenHash: criteria.value,
        })
          .lean<MongoVerificationToken>()
          .exec();

        return record ? this.toVerificationToken(record) : null;
      }

      case "user": {
        const filter = {
          userId: toObjectId(criteria.userId),
          ...(criteria.tokenType && {
            type: criteria.tokenType,
          }),
        };

        const records = await VerificationTokenModel.find(filter)
          .lean<MongoVerificationToken[]>()
          .exec();

        return records.map(record => this.toVerificationToken(record));
      }
    }
  }

  async create(data: CreateVerificationTokenData): Promise<VerificationToken> {
    const record = await VerificationTokenModel.create(data);

    return this.toVerificationToken(record);
  }

  async markAsUsed(
    tokenId: VerificationTokenId,
    usedAt = new Date(),
  ): Promise<VerificationToken | null> {
    const record = await VerificationTokenModel.findByIdAndUpdate(
      toObjectId(tokenId),
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
  }

  async delete(criteria: DeleteVerificationTokenCriteria): Promise<number> {
    switch (criteria.type) {
      case "id": {
        const result = await VerificationTokenModel.deleteOne({
          _id: toObjectId(criteria.value),
        }).exec();

        return result.deletedCount;
      }

      case "hash": {
        const result = await VerificationTokenModel.deleteOne({
          tokenHash: criteria.value,
        }).exec();

        return result.deletedCount;
      }

      case "user": {
        const filter = {
          userId: toObjectId(criteria.userId),
          ...(criteria.tokenType && {
            type: criteria.tokenType,
          }),
        };

        const result = await VerificationTokenModel.deleteMany(filter).exec();

        return result.deletedCount;
      }

      case "expired": {
        const result = await VerificationTokenModel.deleteMany({
          expiresAt: {
            $lt: criteria.before ?? new Date(),
          },
        }).exec();

        return result.deletedCount;
      }
    }
  }

  private toVerificationToken(record: MongoVerificationToken): VerificationToken {
    return {
      id: record._id.toString() as VerificationTokenId,
      userId: record.userId.toString() as VerificationToken["userId"],
      type: record.type,
      tokenHash: record.tokenHash as VerificationToken["tokenHash"],
      expiresAt: record.expiresAt,
      ...(record.usedAt && {
        usedAt: record.usedAt,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
