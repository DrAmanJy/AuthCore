import type { QueryFilter, Types } from "mongoose";

import { mapDatabaseError } from "../../errors/database-error.utils.js";
import UserModel, { type IUser } from "../../models/user.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import { asOrganizationId } from "../organization/organization.types.js";
import type { FindManyOptions, PaginatedResult } from "../repository-pagination.types.js";
import type { UserRepository } from "./user.repository.js";
import {
  asUserId,
  type CreateUserData,
  type DeleteUserCriteria,
  type ExistsUserCriteria,
  type FindManyUsersCriteria,
  type FindUserCredentialsCriteria,
  type FindUserCriteria,
  type UpdateUserCriteria,
  type UpdateUserData,
  type User,
  type UserCredentials,
  type UserId,
  type UserStatus,
} from "./user.types.js";

type MongoUserRecord = {
  _id: Types.ObjectId;
  email: string;
  emailVerified: boolean;
  passwordHash: string;
  displayName: string;
  status: UserStatus;
  lastLoginAt?: Date;
  managedBy?: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class MongoUserRepository implements UserRepository {
  async exists(criteria: ExistsUserCriteria): Promise<boolean> {
    try {
      const filter: QueryFilter<IUser> = {
        deletedAt: { $exists: false },
        ...(criteria.by === "id"
          ? { _id: toObjectId(criteria.userId) }
          : { email: criteria.email.toLowerCase() }),
      };

      const count = await UserModel.countDocuments(filter);

      return count > 0;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async find(criteria: FindUserCriteria): Promise<User | null> {
    try {
      const filter: QueryFilter<IUser> = {
        deletedAt: { $exists: false },
        ...(criteria.by === "id"
          ? { _id: toObjectId(criteria.userId) }
          : { email: criteria.email.toLowerCase() }),
      };

      const user = await UserModel.findOne(filter)
        .lean<MongoUserRecord>()
        .exec();

      return user ? this.toUser(user) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findCredentials(
    criteria: FindUserCredentialsCriteria,
  ): Promise<UserCredentials | null> {
    try {
      const filter: QueryFilter<IUser> = {
        deletedAt: { $exists: false },
        ...(criteria.by === "id"
          ? { _id: toObjectId(criteria.userId) }
          : { email: criteria.email.toLowerCase() }),
      };

      const user = await UserModel.findOne(filter)
        .select("+passwordHash")
        .lean<MongoUserRecord>()
        .exec();

      return user ? this.toUserCredentials(user) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findMany(
    criteria: FindManyUsersCriteria,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<User>> {
    try {
      const filter: QueryFilter<IUser> = {
        deletedAt: { $exists: false },
        ...(criteria.status && { status: criteria.status }),
        ...(criteria.managedBy && { managedBy: toObjectId(criteria.managedBy) }),
      };

      const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);

      if (options?.cursor) {
        filter._id = {
          $gt: toObjectId(options.cursor),
        };
      }

      const records = await UserModel.find(filter)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .lean<MongoUserRecord[]>()
        .exec();

      const hasNextPage = records.length > limit;
      const pagedRecords = hasNextPage ? records.slice(0, limit) : records;
      const items = pagedRecords.map(record => this.toUser(record));
      const nextCursor = hasNextPage ? (items.at(-1)?.id ?? null) : null;

      return {
        items,
        nextCursor,
      };
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async create(data: CreateUserData): Promise<User> {
    try {
      const user = await UserModel.create({
        ...data,
        email: data.email.toLowerCase(),
        managedBy: data.managedBy ? toObjectId(data.managedBy) : undefined,
      });

      return this.toUser(user.toObject());
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async update(
    criteria: UpdateUserCriteria,
    data: UpdateUserData,
  ): Promise<User | null> {
    try {
      const user = await UserModel.findOneAndUpdate(
        {
          _id: toObjectId(criteria.userId),
          deletedAt: { $exists: false },
        },
        { $set: data },
        { returnDocument: "after", runValidators: true },
      )
        .lean<MongoUserRecord>()
        .exec();

      return user ? this.toUser(user) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async updatePassword(
    userId: UserId,
    passwordHash: string,
  ): Promise<User | null> {
    try {
      const user = await UserModel.findOneAndUpdate(
        {
          _id: toObjectId(userId),
          deletedAt: { $exists: false },
        },
        { $set: { passwordHash } },
        { returnDocument: "after", runValidators: true },
      )
        .lean<MongoUserRecord>()
        .exec();

      return user ? this.toUser(user) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async softDelete(criteria: DeleteUserCriteria): Promise<User | null> {
    try {
      const user = await UserModel.findOneAndUpdate(
        {
          _id: toObjectId(criteria.userId),
          deletedAt: { $exists: false },
        },
        {
          $set: { deletedAt: new Date() },
        },
        { returnDocument: "after", runValidators: true },
      )
        .lean<MongoUserRecord>()
        .exec();

      return user ? this.toUser(user) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async delete(criteria: DeleteUserCriteria): Promise<boolean> {
    try {
      const result = await UserModel.findByIdAndDelete(
        toObjectId(criteria.userId),
      ).exec();

      return Boolean(result);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  private toUser(record: MongoUserRecord): User {
    return {
      id: asUserId(record._id.toString()),
      email: record.email,
      displayName: record.displayName,
      status: record.status,
      ...(record.lastLoginAt !== undefined && {
        lastLoginAt: record.lastLoginAt,
      }),
      ...(record.managedBy !== undefined && {
        managedBy: asOrganizationId(record.managedBy.toString()),
      }),
      ...(record.deletedAt !== undefined && {
        deletedAt: record.deletedAt,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toUserCredentials(record: MongoUserRecord): UserCredentials {
    return {
      ...this.toUser(record),
      emailVerified: record.emailVerified,
      passwordHash: record.passwordHash,
    };
  }
}
