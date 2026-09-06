export { connectDatabase, disconnectDatabase } from "./client/mongodb.client.js";

export {
  DatabaseError,
  DuplicateKeyError,
  DatabaseConnectionError,
} from "./errors/database.errors.js";

export { mapDatabaseError } from "./errors/database-error.utils.js";

export type {
  UserRepository,
  UserId,
  CreateUserData,
  UpdateUserData,
} from "./repositories/user.repository.js";

export { MongoUserRepository } from "./repositories/mongo-user.repository.js";

export type { IUser, UserDocument, UserStatus } from "./models/user.model.js";
