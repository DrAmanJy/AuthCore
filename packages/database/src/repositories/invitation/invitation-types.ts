import type {
  InvitationStatus,
  TargetType,
} from "../../models/invitation.model.js";
import type { OrganizationId } from "../organization/organization.types.js";
import type { RoleId } from "../role/role.types.js";
import type { ActorId, UserId } from "../user/user.types.js";

export type InvitationId = string & { readonly __brand: "InvitationId" };

export const asInvitationId = (id: string): InvitationId => id as InvitationId;

export type Invitation = {
  id: InvitationId;
  organizationId: OrganizationId;
  roleId: RoleId;
  targetType: TargetType;
  targetUserId?: UserId;
  targetEmail?: string;
  invitedBy: UserId;
  tokenHash: string;
  status: InvitationStatus;
  actionAt?: Date;
  actionBy?: ActorId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateInvitationData = {
  organizationId: OrganizationId;
  roleId: RoleId;
  targetType: TargetType;
  targetEmail?: string;
  targetUserId?: UserId;
  invitedBy: UserId;
  tokenHash: string;
  expiresAt: Date;
};

export type CreateInvitation = CreateInvitationData;

export type UpdateInvitationData = {
  status: Exclude<InvitationStatus, "pending" | "revoked"> | "expired";
  actionBy?: ActorId;
};

export type UpdateInvitation = UpdateInvitationData;

export type FindInvitationCriteria =
  | {
      by: "id";
      invitationId: InvitationId;
      organizationId?: OrganizationId;
    }
  | {
      by: "tokenHash";
      tokenHash: string;
    }
  | {
      by: "user";
      userId: UserId;
      organizationId: OrganizationId;
    }
  | {
      by: "email";
      email: string;
      organizationId: OrganizationId;
    };

export interface FindManyInvitationsCriteria {
  organizationId?: OrganizationId;
  userId?: UserId;
  email?: string;
  status?: InvitationStatus;
  activeOnly?: boolean;
}

export interface UpdateInvitationCriteria {
  invitationId: InvitationId;
  organizationId: OrganizationId;
}

export interface RevokeInvitationCriteria {
  invitationId: InvitationId;
  organizationId: OrganizationId;
  actorId: ActorId;
  reason?: string;
}
