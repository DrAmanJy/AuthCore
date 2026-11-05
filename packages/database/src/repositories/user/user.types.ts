import type { USER_STATUSES } from "../../models/user.model.js";
import type { OrganizationId } from "../organization/organization.types.js";

export type UserId = string & {
  readonly __brand: "UserId";
};

export type ActorId = UserId;

export type CreatedBy = {
  displayName: string;
  id: UserId;
};

export const asUserId = (id: string): UserId => id as UserId;

export const asActorId = (id: string): ActorId => id as UserId;

export type UserStatus = (typeof USER_STATUSES)[number];

export type User = {
  id: UserId;
  email: string;
  displayName: string;
  status: UserStatus;
  lastLoginAt?: Date;
  managedBy?: OrganizationId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type UserCredentials = User & {
  emailVerified: boolean;
  passwordHash: string;
};

export type CreateUserData = Pick<
  UserCredentials,
  "email" | "passwordHash" | "displayName" | "emailVerified" | "lastLoginAt" | "managedBy"
> &
  Partial<Pick<UserCredentials, "status">>;

export type UpdateUserData = Partial<Omit<CreateUserData, "passwordHash" | "managedBy">>;

export type ExistsUserCriteria =
  | {
      by: "id";
      userId: UserId;
    }
  | {
      by: "email";
      email: string;
    };

export type FindUserCriteria =
  | {
      by: "id";
      userId: UserId;
    }
  | {
      by: "email";
      email: string;
    };

export type FindUserCredentialsCriteria =
  | {
      by: "id";
      userId: UserId;
    }
  | {
      by: "email";
      email: string;
    };

export interface FindManyUsersCriteria {
  status?: UserStatus;
  managedBy?: OrganizationId;
}

export interface UpdateUserCriteria {
  userId: UserId;
}

export interface DeleteUserCriteria {
  userId: UserId;
}
