import type {
  HardDeleteRepository,
  SoftDeleteRepository,
  StandardRepository,
} from "../repository.contracts.js";
import type {
  CreateUserData,
  DeleteUserCriteria,
  ExistsUserCriteria,
  FindManyUsersCriteria,
  FindUserCredentialsCriteria,
  FindUserCriteria,
  UpdateUserCriteria,
  UpdateUserData,
  User,
  UserCredentials,
  UserId,
} from "./user.types.js";

export interface UserRepository
  extends
    StandardRepository<
      User,
      FindUserCriteria,
      FindManyUsersCriteria,
      CreateUserData,
      UpdateUserCriteria,
      UpdateUserData
    >,
    SoftDeleteRepository<User, DeleteUserCriteria>,
    HardDeleteRepository<DeleteUserCriteria> {
  exists(criteria: ExistsUserCriteria): Promise<boolean>;

  findCredentials(
    criteria: FindUserCredentialsCriteria,
  ): Promise<UserCredentials | null>;

  updatePassword(userId: UserId, passwordHash: string): Promise<User | null>;
}
