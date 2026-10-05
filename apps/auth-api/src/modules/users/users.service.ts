import type { UserId, CreateUserData, UserCredentials } from "@authcore/database";

import type { User, UserRepository } from "@authcore/database";
import type { ChangeEmail, ChangeStatus, UpdateProfile } from "@authcore/contracts";
import { ResourceError } from "../../errors/resource-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAuthenticatedUser(userId: UserId): Promise<User> {
    const user = await this.getUserById(userId);

    this.validateAccountStatus(user);

    return user;
  }

  async getUserById(userId: UserId): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) throw new ResourceError(ERROR_CODES.USER_NOT_FOUND);

    return user;
  }

  async getUserCredentials(
    criteria: { type: "email"; value: string } | { type: "id"; value: UserId },
  ): Promise<UserCredentials> {
    const user =
      criteria.type === "email"
        ? await this.userRepository.findCredentialsByEmail(criteria.value)
        : await this.userRepository.findCredentialsById(criteria.value);

    if (!user) {
      throw new ResourceError(ERROR_CODES.USER_NOT_FOUND);
    }

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAllUsers();
  }

  async create(data: CreateUserData): Promise<User> {
    const existingUser = await this.userRepository.exists({
      type: "email",
      value: data.email,
    });

    if (existingUser) {
      throw new ResourceError(ERROR_CODES.USER_EMAIL_ALREADY_EXISTS);
    }

    return this.userRepository.create(data);
  }

  async updateProfile(userId: UserId, data: UpdateProfile): Promise<User> {
    await this.getAuthenticatedUser(userId);

    const user = await this.userRepository.update(userId, {
      displayName: data.displayName,
    });

    if (!user) throw new ResourceError(ERROR_CODES.USER_NOT_FOUND);
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
    const user = await this.userRepository.update(userId, { emailVerified: true });

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
      throw new ResourceError(ERROR_CODES.USER_NOT_FOUND);
    }

    return user;
  }

  async deleteUser(userId: UserId): Promise<User> {
    await this.getUserById(userId);

    const user = await this.userRepository.delete(userId);
    if (!user) {
      throw new ResourceError(ERROR_CODES.USER_NOT_FOUND);
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
