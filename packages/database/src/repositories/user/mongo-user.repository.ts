import { Types } from "mongoose";

import type {
  CreateUserData,
  UpdateUserData,
  User,
  UserCredentials,
  UserId,
  UserStatus,
} from "./user.types.js";

import { UserRepository } from "./user.repository.js";
import UserModel from "../../models/user.model.js";
import { mapDatabaseError } from "../../errors/database-error.utils.js";

type MongoUserRecord = {
  _id: Types.ObjectId;
  email: string;
  displayName: string;
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type MongoUserCredentialsRecord = {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
};

export class MongoUserRepository implements UserRepository {
  async findAllUsers(): Promise<User[]> {
    try {
      const users = await UserModel.find()
        .select("_id email displayName status lastLoginAt createdAt updatedAt")
        .lean()
        .exec();

      return users.map(user => this.toUserType(user));
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findById(userId: UserId): Promise<User | null> {
    const objectId = this.toObjectId(userId);

    if (!objectId) {
      return null;
    }

    try {
      const user = await UserModel.findById(objectId)
        .select("_id email displayName status lastLoginAt createdAt updatedAt")
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

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    try {
      const user = await UserModel.findOne({
        email: email.toLowerCase().trim(),
      })
        .select("_id email +passwordHash")
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
    const objectId = this.toObjectId(userId);

    if (!objectId) {
      return null;
    }

    try {
      const user = await UserModel.findById(objectId)
        .select("_id email +passwordHash")
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
    const objectId = this.toObjectId(userId);

    if (!objectId) {
      return null;
    }

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
        .select("_id email displayName status lastLoginAt createdAt updatedAt")
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

  async delete(userId: UserId): Promise<User | null> {
    const objectId = this.toObjectId(userId);

    if (!objectId) {
      return null;
    }

    try {
      const user = await UserModel.findByIdAndDelete(objectId)
        .select("_id email displayName status lastLoginAt createdAt updatedAt")
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

  private toObjectId(id: string): Types.ObjectId | null {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return new Types.ObjectId(id);
  }

  private toUserType(record: MongoUserRecord): User {
    return {
      id: record._id.toString(),
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

  private toUserCredentials(record: MongoUserCredentialsRecord): UserCredentials {
    return {
      id: record._id.toString(),
      email: record.email,
      passwordHash: record.passwordHash,
    };
  }
}

export default MongoUserRepository;
