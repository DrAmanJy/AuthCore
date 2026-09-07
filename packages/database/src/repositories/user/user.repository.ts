import type {
  CreateUserData,
  UpdateUserData,
  User,
  UserCredentials,
  UserId,
} from "./user.types.js";

export interface UserRepository {
  findAllUsers(): Promise<User[]>;

  findById(userId: UserId): Promise<User | null>;

  findCredentialsByEmail(email: string): Promise<UserCredentials | null>;

  findCredentialsById(userId: UserId): Promise<UserCredentials | null>;

  create(data: CreateUserData): Promise<User>;

  update(userId: UserId, data: UpdateUserData): Promise<User | null>;

  delete(userId: UserId): Promise<User | null>;
}
