import type {
  CreateUserData,
  ExistsUserCriteria,
  UpdateUserData,
  User,
  UserCredentials,
  UserId,
} from "./user.types.js";

export interface UserRepository {
  exists(criteria: ExistsUserCriteria): Promise<boolean>;

  find(criteria: {
    type: "id";
    value: UserId;
    credentials: true;
  }): Promise<UserCredentials | null>;

  find(criteria: { type: "id"; value: UserId; credentials: false }): Promise<User | null>;

  find(criteria: {
    type: "email";
    value: string;
    credentials: true;
  }): Promise<UserCredentials | null>;

  find(criteria: {
    type: "email";
    value: string;
    credentials: false;
  }): Promise<User | null>;

  find(criteria: { type: "all" }): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;

  update(userId: UserId, data: UpdateUserData): Promise<User | null>;

  updatePassword(userId: UserId, passwordHash: string): Promise<User | null>;

  delete(userId: UserId): Promise<User | null>;
}
