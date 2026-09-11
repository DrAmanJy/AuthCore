import type { UserId, CreateUserData, UserCredentials } from "@authcore/database";

import type { User, UserRepository } from "@authcore/database";
import type { ChangeEmail, ChangeStatus, UpdateProfile } from "@authcore/contracts";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAuthenticatedUser(userId: UserId): Promise<User> {
    const user = await this.getUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    this.validateAccountStatus(user);

    return user;
  }

  async getUserById(userId: UserId): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) throw new Error("User not found");

    return user;
  }

  async getUserCredentialsByEmail(email: string): Promise<UserCredentials> {
    const user = await this.userRepository.findCredentialsByEmail(email);
    if (!user) throw new Error("User not found");

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
      throw new Error("Invalid Email or a user exists with this email");
    }

    return this.userRepository.create(data);
  }

  async updateProfile(userId: UserId, data: UpdateProfile): Promise<User> {
    await this.getAuthenticatedUser(userId);

    const user = await this.userRepository.update(userId, {
      displayName: data.displayName,
    });

    if (!user) throw new Error("User not found");
    return user;
  }
  async updateLastLoginAt(userId: UserId): Promise<User> {
    await this.getAuthenticatedUser(userId);

    const user = await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async changeEmail(userId: UserId, data: ChangeEmail): Promise<User> {
    await this.getAuthenticatedUser(userId);

    const user = await this.userRepository.update(userId, {
      email: data.email,
    });

    if (!user) throw new Error("User not found");
    return user;
  }

  async changeStatus(userId: UserId, data: ChangeStatus): Promise<User> {
    await this.getUserById(userId);

    const user = await this.userRepository.update(userId, {
      status: data.status,
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async deleteUser(userId: UserId): Promise<User> {
    await this.getUserById(userId);

    const user = await this.userRepository.delete(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async deactivateUser(userId: UserId) {
    await this.getAuthenticatedUser(userId);
    return this.changeStatus(userId, { status: "deactivated" });
  }

  public validateAccountStatus(user: User | UserCredentials): void {
    if ("emailVerified" in user && !user.emailVerified) {
      throw new Error("User email is not verified");
    }

    switch (user.status) {
      case "deactivated":
        throw new Error("User account is deactivated");

      case "inactive":
        throw new Error("User account is inactive");

      case "pending":
        throw new Error("User account is pending");

      case "suspended":
        throw new Error("User account is suspended");

      case "active":
        return;
    }
  }
}
