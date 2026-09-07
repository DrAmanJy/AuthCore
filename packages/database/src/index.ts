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
} from "./repositories/user.types.js";

export type { UserStatus } from "./models/user.model.js";

export type { UserRepository } from "./repositories/user.repository.js";

export { MongoUserRepository } from "./repositories/mongo-user.repository.js";
