export * from "./utils/time.utils.js";

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
export { asSessionId } from "./repositories/session/session.types.js";
export type {
  Session,
  SessionId,
  Device,
  CreateSessionData,
  UpdateSessionData,
  FindSessionCriteria,
} from "./repositories/session/session.types.js";

export type { SessionRepository } from "./repositories/session/session.repository.js";

export { MongoSessionRepository } from "./repositories/session/mongo-session.repository.js";

// Refresh Token

export type {
  RefreshToken,
  RefreshTokenHash,
  RefreshTokenId,
  TokenFamilyId,
  RefreshTokenRecord,
  CreateRefreshTokenData,
  UpdateRefreshTokenData,
} from "./repositories/refresh-token/refresh-token.types.js";

export {
  asRefreshToken,
  asRefreshTokenHash,
  asRefreshTokenId,
  asTokenFamilyId,
} from "./repositories/refresh-token/refresh-token.types.js";

export type { RefreshTokenRepository } from "./repositories/refresh-token/refresh-token.repository.js";

export { MongoRefreshTokenRepository } from "./repositories/refresh-token/mongo-refresh-token.repository.js";

// Verification Token

export type {
  VerificationToken,
  VerificationTokenId,
  VerificationTokenHash,
  VerificationTokenType,
  CreateVerificationTokenData,
  UpdateVerificationTokenData,
  FindVerificationTokenCriteria,
  DeleteVerificationTokenCriteria,
} from "./repositories/verification-token/verification-token.types.js";

export {
  asVerificationTokenId,
  asVerificationTokenHash,
} from "./repositories/verification-token/verification-token.types.js";

export type { VerificationTokenRepository } from "./repositories/verification-token/verification-repository.js";

export { MongoVerificationTokenRepository } from "./repositories/verification-token/mongo-verification-repository.js";
