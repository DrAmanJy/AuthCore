import type { InvitationStatus, TargetType } from "../../models/invitation.model.js";
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

export type CreateInvitation = Pick<
  Invitation,
  | "organizationId"
  | "roleId"
  | "targetType"
  | "targetEmail"
  | "targetUserId"
  | "invitedBy"
  | "tokenHash"
  | "expiresAt"
>;

export type UpdateInvitation = {
  status: Exclude<InvitationStatus, "pending" | "revoked">;
};

export type FindInvitationCriteria =
  | { type: "email"; value: string; orgId?: OrganizationId }
  | { type: "id"; value: InvitationId }
  | { type: "user"; value: UserId; orgId?: OrganizationId }
  | { type: "organization"; value: OrganizationId };
