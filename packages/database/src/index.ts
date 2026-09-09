export { connectDatabase, disconnectDatabase } from "./client/mongodb.client.js";

export {
  DatabaseError,
  DuplicateKeyError,
  DatabaseConnectionError,
} from "./errors/database.errors.js";

export { mapDatabaseError } from "./errors/database-error.utils.js";

// User
export { asUserId } from "./repositories/user/user.types.js";
export type {
  User,
  UserId,
  UserCredentials,
  CreateUserData,
  UpdateUserData,
  UserStatus,
  ExistsUserCriteria,
} from "./repositories/user/user.types.js";

export type { UserRepository } from "./repositories/user/user.repository.js";

export { MongoUserRepository } from "./repositories/user/mongo-user.repository.js";

// Session
export { asRefreshTokenHash } from "./repositories/session/session.types.js";
export type {
  Session,
  SessionId,
  OrganizationId,
  RefreshTokenHash,
  Device,
  CreateSessionData,
  UpdateSessionData,
  FindSessionCriteria,
} from "./repositories/session/session.types.js";

export type { SessionRepository } from "./repositories/session/session.repository.js";

export { MongoSessionRepository } from "./repositories/session/mongo-session.repository.js";
