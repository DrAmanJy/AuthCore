import type { USER_STATUSES } from "../../models/user.model.js";

export type UserId = string;

export type UserStatus = (typeof USER_STATUSES)[number];

export type User = {
  id: UserId;
  email: string;
  displayName: string;
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type UserCredentials = {
  id: UserId;
  email: string;
  passwordHash: string;
};

export type CreateUserData = {
  email: string;
  passwordHash: string;
  displayName: string;
  emailVerified?: boolean;
  status?: UserStatus;
  lastLoginAt?: Date;
};

export type UpdateUserData = {
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
  status?: UserStatus;
  lastLoginAt?: Date;
};
