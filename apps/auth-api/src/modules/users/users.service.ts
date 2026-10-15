import type { UserId, CreateUserData, UserCredentials } from "@authcore/database";

import type { User, UserRepository } from "@authcore/database";
import type { ChangeEmail, ChangeStatus, UpdateProfile } from "@authcore/contracts";
import { ResourceError } from "../../errors/resource-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import { logger } from "@authcore/logger";
import { InternalServerError } from "../../errors/internal-server-error.js";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAuthenticatedUser(userId: UserId): Promise<User> {
    const user = await this.getUserById(userId);

    this.validateAccountStatus(user);

    return user;
  }

  async getUserById(userId: UserId): Promise<User> {
    const user = await this.userRepository.find({
      type: "id",
      value: userId,
      credentials: false,
    });

    if (!user) throw new ResourceError(ERROR_CODES.USER_NOT_FOUND);

    return user;
  }
  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.find({
      type: "email",
      value: email,
      credentials: false,
    });

    if (!user) throw new ResourceError(ERROR_CODES.USER_NOT_FOUND);

    return user;
  }

  async getUserCredentials(
    criteria: { type: "id"; value: UserId } | { type: "email"; value: string },
  ): Promise<UserCredentials> {
    const user =
      criteria.type === "id"
        ? await this.userRepository.find({
            type: "id",
            value: criteria.value,
            credentials: true,
          })
        : await this.userRepository.find({
            type: "email",
            value: criteria.value,
            credentials: true,
          });

    if (!user) {
      throw new ResourceError(ERROR_CODES.USER_NOT_FOUND);
    }

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({ type: "all" });
  }

  async create(data: CreateUserData): Promise<User> {
    const existingUser = await this.userRepository.exists({
      type: "email",
      value: data.email,
    });

    if (existingUser) {
      logger.warn(
        {
          event: "user.create.rejected",
          reason: "email_already_exists",
        },
        "User creation rejected because email already exists",
      );

      throw new ResourceError(ERROR_CODES.USER_EMAIL_ALREADY_EXISTS);
    }

    const user = await this.userRepository.create(data);

    logger.info(
      {
        event: "user.create.success",
        userId: user.id,
      },
      "User created successfully",
    );

    return user;
  }

  async updateProfile(userId: UserId, data: UpdateProfile): Promise<User> {
    await this.getAuthenticatedUser(userId);

    const user = await this.userRepository.update(userId, {
      displayName: data.displayName,
    });

    if (!user) {
      throw new InternalServerError();
    }

    logger.info(
      { event: "user.profile.update.success", userId: user.id },
      "User profile updated successfully",
    );
    return user;
  }

  async updateLastLoginAt(userId: UserId): Promise<User> {
    await this.getAuthenticatedUser(userId);

    const user = await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });

    if (!user) {
      throw new ResourceError(ERROR_CODES.USER_NOT_FOUND);
    }

    return user;
  }

  async updatePassword(userId: UserId, passwordHash: string): Promise<User> {
    await this.getAuthenticatedUser(userId);
    const user = await this.userRepository.updatePassword(userId, passwordHash);

    if (!user) {
      throw new ResourceError(ERROR_CODES.USER_PASSWORD_UPDATE_FAILED);
    }

    return user;
  }

  async verifyEmail(userId: UserId): Promise<User> {
    const user = await this.userRepository.update(userId, {
      emailVerified: true,
      status: "active",
    });

    if (!user) {
      throw new ResourceError(ERROR_CODES.USER_NOT_FOUND);
    }

    return user;
  }

  async changeEmail(userId: UserId, data: ChangeEmail): Promise<User> {
    await this.getAuthenticatedUser(userId);

    const user = await this.userRepository.update(userId, {
      email: data.email,
    });

    if (!user) throw new ResourceError(ERROR_CODES.USER_NOT_FOUND);
    return user;
  }

  async changeStatus(userId: UserId, data: ChangeStatus): Promise<User> {
    await this.getUserById(userId);

    const user = await this.userRepository.update(userId, {
      status: data.status,
    });

    if (!user) {
      throw new InternalServerError();
    }

    logger.info(
      {
        event: "user.status.change.success",
        userId: user.id,
        status: user.status,
      },
      "User status successfully changed",
    );
    return user;
  }

  async deleteUser(userId: UserId): Promise<User> {
    await this.getUserById(userId);

    const user = await this.userRepository.delete(userId);

    if (!user) {
      throw new InternalServerError();
    }
    return user;
  }

  async deactivateUser(userId: UserId) {
    await this.getAuthenticatedUser(userId);
    return this.changeStatus(userId, { status: "deactivated" });
  }

  public validateAccountStatus(user: User | UserCredentials): void {
    if ("emailVerified" in user && !user.emailVerified) {
      throw new ResourceError(ERROR_CODES.USER_EMAIL_NOT_VERIFIED);
    }

    switch (user.status) {
      case "deactivated":
        throw new ResourceError(ERROR_CODES.USER_ACCOUNT_DEACTIVATED);

      case "inactive":
        throw new ResourceError(ERROR_CODES.USER_ACCOUNT_INACTIVE);

      case "pending":
        throw new ResourceError(ERROR_CODES.USER_ACCOUNT_PENDING);

      case "suspended":
        throw new ResourceError(ERROR_CODES.USER_ACCOUNT_SUSPENDED);

      case "active":
        return;
    }
  }
}
