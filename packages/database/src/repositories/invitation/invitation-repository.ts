import type { OrganizationId } from "../organization/organization.types.js";
import type { ActorId, UserId } from "../user/user.types.js";
import type {
  CreateInvitation,
  Invitation,
  InvitationId,
  UpdateInvitation,
} from "./invitation-types.js";

export interface InvitationRepository {
  find(criteria: { type: "user"; value: UserId }): Promise<Invitation[]>;

  find(criteria: {
    type: "user";
    value: UserId;
    orgId: OrganizationId;
  }): Promise<Invitation | null>;
  find(criteria: { type: "id"; value: InvitationId }): Promise<Invitation | null>;

  find(criteria: { type: "email"; value: string }): Promise<Invitation[]>;

  find(criteria: {
    type: "email";
    value: string;
    orgId: OrganizationId;
  }): Promise<Invitation | null>;

  find(criteria: { type: "organization"; value: OrganizationId }): Promise<Invitation[]>;

  create(data: CreateInvitation): Promise<Invitation>;

  update(
    id: InvitationId,
    organizationId: OrganizationId,
    data: UpdateInvitation,
    actorId: ActorId,
  ): Promise<Invitation | null>;

  revoke(
    id: InvitationId,
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<Invitation | null>;
}
