import type { Types } from "mongoose";

import { toObjectId } from "../../utils/object-id.utils.js";

import { asUserId } from "./user.types.js";
import type {
  ExistsUserCriteria,
  CreateUserData,
  UpdateUserData,
  User,
  UserCredentials,
  UserId,
  UserStatus,
} from "./user.types.js";

import type { UserRepository } from "./user.repository.js";
import UserModel from "../../models/user.model.js";
import { mapDatabaseError } from "../../errors/database-error.utils.js";

type MongoUserRecord = {
  _id: Types.ObjectId;
  email: string;
  emailVerified: boolean;
  passwordHash: string;
  displayName: string;
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class MongoUserRepository implements UserRepository {
  async exists(criteria: ExistsUserCriteria): Promise<boolean> {
    try {
      switch (criteria.type) {
        case "id": {
          const objectId = toObjectId(criteria.value);

          return (await UserModel.exists({ _id: objectId })) !== null;
        }

        case "email":
          return (await UserModel.exists({ email: criteria.value })) !== null;
      }
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }
  async findAllUsers(): Promise<User[]> {
    try {
      const users = await UserModel.find().lean().exec();

      return users.map(user => this.toUserType(user));
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findById(userId: UserId): Promise<User | null> {
    const objectId = toObjectId(userId);

    try {
      const user = await UserModel.findById(objectId).lean().exec();

      if (!user) {
        return null;
      }

      return this.toUserType(user);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    try {
      const user = await UserModel.findOne({
        email: email.toLowerCase().trim(),
      })
        .select(" +passwordHash")
        .lean()
        .exec();

      if (!user?.passwordHash) {
        return null;
      }

      return this.toUserCredentials(user);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findCredentialsById(userId: UserId): Promise<UserCredentials | null> {
    const objectId = toObjectId(userId);

    try {
      const user = await UserModel.findById(objectId)
        .select(" +passwordHash")
        .lean()
        .exec();

      if (!user?.passwordHash) {
        return null;
      }

      return this.toUserCredentials(user);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async create(data: CreateUserData): Promise<User> {
    try {
      const user = await UserModel.create({
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        emailVerified: data.emailVerified ?? false,
        status: data.status ?? "pending",
        lastLoginAt: data.lastLoginAt,
      });

      return this.toUserType(user);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async update(userId: UserId, data: UpdateUserData): Promise<User | null> {
    const objectId = toObjectId(userId);

    const updateData: UpdateUserData = {};

    if (data.email !== undefined) {
      updateData.email = data.email.toLowerCase().trim();
    }

    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName;
    }

    if (data.emailVerified !== undefined) {
      updateData.emailVerified = data.emailVerified;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.lastLoginAt !== undefined) {
      updateData.lastLoginAt = data.lastLoginAt;
    }

    try {
      const user = await UserModel.findByIdAndUpdate(
        objectId,
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        },
      )
        .lean()
        .exec();

      if (!user) {
        return null;
      }

      return this.toUserType(user);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async updatePassword(userId: UserId, passwordHash: string): Promise<User | null> {
    const record = await UserModel.findByIdAndUpdate(
      toObjectId(userId),
      {
        $set: { passwordHash },
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .lean()
      .exec();

    return record ? this.toUserType(record) : null;
  }

  async delete(userId: UserId): Promise<User | null> {
    const objectId = toObjectId(userId);

    try {
      const user = await UserModel.findByIdAndDelete(objectId).lean().exec();

      if (!user) {
        return null;
      }

      return this.toUserType(user);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  private toUserType(record: MongoUserRecord): User {
    return {
      id: asUserId(record._id.toString()),
      email: record.email,
      displayName: record.displayName,
      status: record.status,
      ...(record.lastLoginAt !== undefined && {
        lastLoginAt: record.lastLoginAt,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toUserCredentials(record: MongoUserRecord): UserCredentials {
    return {
      id: asUserId(record._id.toString()),
      email: record.email,
      emailVerified: record.emailVerified,
      passwordHash: record.passwordHash,
      displayName: record.displayName,
      status: record.status,
      lastLoginAt: record.lastLoginAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export default MongoUserRepository;
