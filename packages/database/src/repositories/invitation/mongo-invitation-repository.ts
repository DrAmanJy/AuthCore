import type { QueryFilter } from "mongoose";
import type { IInvitation } from "../../models/invitation.model.js";
import type { OrganizationId } from "../organization/organization.types.js";
import type {
  CreateInvitation,
  FindInvitationCriteria,
  Invitation,
  InvitationId,
  UpdateInvitation,
} from "./invitation-types.js";
import type { InvitationRepository } from "./invitation-repository.js";
import type { ActorId, UserId } from "../user/user.types.js";

import InvitationModel from "../../models/invitation.model.js";

import { asOrganizationId } from "../organization/organization.types.js";
import { asActorId, asUserId } from "../user/user.types.js";
import { asInvitationId } from "./invitation-types.js";
import { asRoleId } from "../role/role.types.js";

import { mapDatabaseError } from "../../errors/database-error.utils.js";
import { toObjectId } from "../../utils/object-id.utils.js";

export class MongoInvitationRepository implements InvitationRepository {
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

  async find(
    criteria: FindInvitationCriteria,
  ): Promise<Invitation | Invitation[] | null> {
    try {
      const filter: QueryFilter<IInvitation> = {
        status: "pending",
        expiresAt: { $gt: new Date() },
      };

      switch (criteria.type) {
        case "user":
          filter.targetUserId = toObjectId(criteria.value);

          if (criteria.orgId) {
            filter.organizationId = toObjectId(criteria.orgId);
          }
          break;

        case "id":
          filter.id = toObjectId(criteria.value);
          break;

        case "email":
          filter.targetEmail = criteria.value.trim().toLowerCase();

          if (criteria.orgId) {
            filter.organizationId = toObjectId(criteria.orgId);
          }
          break;

        case "organization":
          filter.organizationId = toObjectId(criteria.value);
          break;
      }

      if (criteria.type === "id") {
        const invitation = await InvitationModel.findOne(filter).exec();

        return invitation ? this.toInvitation(invitation) : null;
      }

      if ((criteria.type === "user" || criteria.type === "email") && criteria.orgId) {
        const invitation = await InvitationModel.findOne(filter).exec();

        return invitation ? this.toInvitation(invitation) : null;
      }

      const invitations = await InvitationModel.find(filter).exec();

      return invitations.map(invitation => this.toInvitation(invitation));
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async create(data: CreateInvitation): Promise<Invitation> {
    try {
      const invitation = await InvitationModel.create(data);

      return this.toInvitation(invitation);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async update(
    id: InvitationId,
    data: UpdateInvitation,
    actorId: ActorId,
  ): Promise<Invitation | null> {
    const invitation = await InvitationModel.findOneAndUpdate(
      toObjectId(id),
      { status: data.status, actionAt: new Date(), actionBy: toObjectId(actorId) },
      {
        returnDocument: "after",
        runValidators: true,
      },
    )
      .lean()
      .exec();

    return invitation ? this.toInvitation(invitation) : null;
  }

  async revoke(id: InvitationId, actorId: ActorId): Promise<Invitation | null> {
    const invitation = await InvitationModel.findOneAndUpdate(
      toObjectId(id),
      { status: "revoked", actionAt: new Date(), actionBy: toObjectId(actorId) },
      {
        returnDocument: "after",
        runValidators: true,
      },
    )
      .lean()
      .exec();

    return invitation ? this.toInvitation(invitation) : null;
  }

  private toInvitation(record: IInvitation): Invitation {
    return {
      id: asInvitationId(record._id.toString()),
      organizationId: asOrganizationId(record.organizationId.toString()),
      roleId: asRoleId(record.roleId.toString()),
      targetType: record.targetType,
      ...(record.targetUserId && {
        targetUserId: asUserId(record.targetUserId.toString()),
      }),
      ...(record.targetEmail && { targetEmail: record.targetEmail }),
      invitedBy: asUserId(record.invitedBy.toString()),
      tokenHash: record.tokenHash,
      status: record.status,
      ...(record.actionAt && { actionAt: record.actionAt }),
      ...(record.actionBy && {
        actionBy: asActorId(record.actionBy.toString()),
      }),
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
