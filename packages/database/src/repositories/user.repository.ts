import type { UserDocument, UserStatus } from "../models/user.model.js";

export type UserId = string;

export interface CreateUserData {
  email: string;
  passwordHash: string;
  displayName: string;
  emailVerified?: boolean;
  status?: UserStatus;
  lastLoginAt?: Date;
}

export interface UpdateUserData {
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
  status?: UserStatus;
  lastLoginAt?: Date;
}

export interface UserRepository {
  findById(userId: UserId): Promise<UserDocument | null>;

  findByEmail(email: string): Promise<UserDocument | null>;

  findCredentialsByEmail(email: string): Promise<UserDocument | null>;

  create(data: CreateUserData): Promise<UserDocument>;

  update(userId: UserId, data: UpdateUserData): Promise<UserDocument | null>;

  delete(userId: UserId): Promise<UserDocument | null>;
}
