import type {
  CreateRepository,
  ReadRepository,
} from "../repository.contracts.js";
import type {
  CreateSessionData,
  FindManySessionsCriteria,
  FindSessionCriteria,
  RevokeSessionCriteria,
  Session,
  SessionId,
  UpdateSessionData,
} from "./session.types.js";
import type { UserId } from "../user/user.types.js";
import type { OrganizationId } from "../organization/organization.types.js";

export interface SessionRepository
  extends ReadRepository<Session, FindSessionCriteria, FindManySessionsCriteria>,
    CreateRepository<Session, CreateSessionData> {
  update(sessionId: SessionId, data: UpdateSessionData): Promise<Session | null>;

  revoke(criteria: RevokeSessionCriteria): Promise<Session | null>;

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
