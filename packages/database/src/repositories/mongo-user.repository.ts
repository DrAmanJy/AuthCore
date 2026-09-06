import { Types } from "mongoose";

import UserModel, { type UserDocument } from "../models/user.model.js";
import { mapDatabaseError } from "../errors/database-error.utils.js";

import type {
  CreateUserData,
  UpdateUserData,
  UserId,
  UserRepository,
} from "./user.repository.js";

export class MongoUserRepository implements UserRepository {
  async findById(userId: UserId): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    try {
      return await UserModel.findById(userId).exec();
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await UserModel.findOne({
        email: email.toLowerCase().trim(),
      }).exec();
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findCredentialsByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await UserModel.findOne({
        email: email.toLowerCase().trim(),
      })
        .select("+passwordHash")
        .exec();
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async create(data: CreateUserData): Promise<UserDocument> {
    try {
      return await UserModel.create({
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        emailVerified: data.emailVerified ?? false,
        status: data.status ?? "pending",
        lastLoginAt: data.lastLoginAt,
      });
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async update(userId: UserId, data: UpdateUserData): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(userId)) {
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
      return await UserModel.findByIdAndUpdate(
        userId,
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        },
      ).exec();
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async delete(userId: UserId): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    try {
      return await UserModel.findByIdAndDelete(userId).exec();
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }
}
