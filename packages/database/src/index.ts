export { connectDatabase, disconnectDatabase } from "./client/mongodb.client.js";

export {
  DatabaseError,
  DuplicateKeyError,
  DatabaseConnectionError,
} from "./errors/database.errors.js";

export { mapDatabaseError } from "./errors/database-error.utils.js";

export type {
  User,
  UserId,
  UserCredentials,
  CreateUserData,
  UpdateUserData,
  UserStatus,
} from "./repositories/user/user.types.js";

export type { UserRepository } from "./repositories/user/user.repository.js";

export { MongoUserRepository } from "./repositories/user/mongo-user.repository.js";
