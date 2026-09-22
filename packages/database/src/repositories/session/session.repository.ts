import type {
  CreateSessionData,
  FindSessionCriteria,
  OrganizationId,
  Session,
  SessionId,
  UpdateSessionData,
} from "./session.types.js";

import type { UserId } from "../user/user.types.js";

export interface SessionRepository {
  findSession(
    criteria: Extract<FindSessionCriteria, { type: "id" }>,
  ): Promise<Session | null>;

  findSession(
    criteria: Extract<FindSessionCriteria, { type: "user" }>,
  ): Promise<Session[]>;

  create(data: CreateSessionData): Promise<Session>;

  updateSession(sessionId: SessionId, data: UpdateSessionData): Promise<Session | null>;

  revoke(sessionId: SessionId, reason?: string): Promise<Session | null>;

  revokeAllByUserId(
    userId: UserId,
    organizationId?: OrganizationId,
    reason?: string,
  ): Promise<number>;

  revokeAllExcept(
    userId: UserId,
    organizationId: OrganizationId,
    sessionId: SessionId,
    reason?: string,
  ): Promise<number>;
}
