// Utils

export * from "./utils/time.utils.js";

// Database

export { connectDatabase, disconnectDatabase } from "./client/mongodb.client.js";

export {
  DatabaseError,
  DuplicateKeyError,
  DatabaseConnectionError,
} from "./errors/database.errors.js";

export { mapDatabaseError } from "./errors/database-error.utils.js";

// ─────────────────────────────────────────────
// User
// ─────────────────────────────────────────────

export { asUserId, asActorId } from "./repositories/user/user.types.js";

export type {
  User,
  UserId,
  ActorId,
  UserCredentials,
  CreateUserData,
  UpdateUserData,
  UserStatus,
  ExistsUserCriteria,
} from "./repositories/user/user.types.js";

export type { UserRepository } from "./repositories/user/user.repository.js";

export { MongoUserRepository } from "./repositories/user/mongo-user.repository.js";

// ─────────────────────────────────────────────
// Session
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Refresh Token
// ─────────────────────────────────────────────

export {
  asRefreshToken,
  asRefreshTokenHash,
  asRefreshTokenId,
  asTokenFamilyId,
} from "./repositories/refresh-token/refresh-token.types.js";

export type {
  RefreshToken,
  RefreshTokenHash,
  RefreshTokenId,
  TokenFamilyId,
  RefreshTokenRecord,
  CreateRefreshTokenData,
  UpdateRefreshTokenData,
} from "./repositories/refresh-token/refresh-token.types.js";

export type { RefreshTokenRepository } from "./repositories/refresh-token/refresh-token.repository.js";

export { MongoRefreshTokenRepository } from "./repositories/refresh-token/mongo-refresh-token.repository.js";

// ─────────────────────────────────────────────
// Verification Token
// ─────────────────────────────────────────────

export {
  asVerificationTokenId,
  asVerificationTokenHash,
} from "./repositories/verification-token/verification-token.types.js";

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

export type { VerificationTokenRepository } from "./repositories/verification-token/verification-repository.js";

export { MongoVerificationTokenRepository } from "./repositories/verification-token/mongo-verification-repository.js";

// ─────────────────────────────────────────────
// Organization
// ─────────────────────────────────────────────

export { asOrganizationId } from "./repositories/organization/organization.types.js";

export type {
  Organization,
  OrganizationId,
  OrganizationStatus,
  CreateOrganizationData,
  UpdateOrganizationData,
} from "./repositories/organization/organization.types.js";

export type { OrganizationRepository } from "./repositories/organization/organization-repository.js";

export { MongoOrganizationRepository } from "./repositories/organization/mongo-organization-repository.js";

// ─────────────────────────────────────────────
// Organization Member
// ─────────────────────────────────────────────

export { asOrganizationMemberId } from "./repositories/organization-member/organization-member.types.js";

export type {
  OrganizationMember,
  OrganizationMemberId,
  OrganizationMemberStatus,
  CreateOrganizationMemberData,
  UpdateOrganizationMemberData,
  FindOrganizationMemberCriteria,
} from "./repositories/organization-member/organization-member.types.js";

export type { OrganizationMemberRepository } from "./repositories/organization-member/organization-member-repository.js";

export { MongoOrganizationMemberRepository } from "./repositories/organization-member/mongo-organization-member-repository.js";

// ─────────────────────────────────────────────
// Role
// ─────────────────────────────────────────────

export { asRoleId } from "./repositories/role/role.types.js";

export type {
  Role,
  RoleId,
  CreateRoleData,
  UpdateRoleData,
  FindRoleCriteria,
} from "./repositories/role/role.types.js";

export type { RoleRepository } from "./repositories/role/role-repository.js";

export { MongoRoleRepository } from "./repositories/role/mongo-role-repository.js";

// ─────────────────────────────────────────────
// Api Keys
// ─────────────────────────────────────────────

export { asApiKeyId, asKeyHash } from "./repositories/api-key/api-key.types.js";

export type {
  ApiKey,
  ApiKeyCredentials,
  ApiKeyId,
  CreateApiKey,
  DeleteApiKeyCriteria,
  FindApiKeyCriteria,
  KeyHash,
  UpdateApiKey,
  UpdateApiKeyCriteria,
} from "./repositories/api-key/api-key.types.js";

export type { ApiKeyRepository } from "./repositories/api-key/api-key-repository.js";

export { MongoApiKeyRepository } from "./repositories/api-key/mongo-api-key-repository.js";

// ─────────────────────────────────────────────
// Invitations
// ─────────────────────────────────────────────

export { asInvitationId } from "./repositories/invitation/invitation-types.js";

export type {
  InvitationId,
  Invitation,
  CreateInvitation,
  UpdateInvitation,
  FindInvitationCriteria,
} from "./repositories/invitation/invitation-types.js";
export type { TargetType } from "./models/invitation.model.js";

export type { InvitationRepository } from "./repositories/invitation/invitation-repository.js";

export { MongoInvitationRepository } from "./repositories/invitation/mongo-invitation-repository.js";

// ─────────────────────────────────────────────
// Audit Log
// ─────────────────────────────────────────────

export { asAuditLogId } from "./repositories/audit-log/audit-log.types.js";

export type {
  AuditLog,
  AuditLogId,
  CreateAuditLogData,
  FindAuditLogCriteria,
} from "./repositories/audit-log/audit-log.types.js";

export type { AuditLogRepository } from "./repositories/audit-log/audit-log.repository.js";

export { MongoAuditLogRepository } from "./repositories/audit-log/mongo-audit-log.repository.js";
