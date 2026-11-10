import type { QueryFilter } from "mongoose";

import InvitationModel, { type IInvitation } from "../../models/invitation.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import { mapDatabaseError } from "../../errors/database-error.utils.js";

import type { InvitationRepository } from "./invitation-repository.js";
import type {
  FindManyOptions,
  PaginatedResult,
} from "../repository-pagination.types.js";
import {
  asInvitationId,
  type CreateInvitationData,
  type FindManyInvitationsCriteria,
  type FindInvitationCriteria,
  type Invitation,
  type RevokeInvitationCriteria,
  type UpdateInvitationCriteria,
  type UpdateInvitationData,
} from "./invitation-types.js";
import { asOrganizationId } from "../organization/organization.types.js";
import { asActorId, asUserId } from "../user/user.types.js";
import { asRoleId } from "../role/role.types.js";

export class MongoInvitationRepository implements InvitationRepository {
  async find(criteria: FindInvitationCriteria): Promise<Invitation | null> {
    try {
      const filter = this.buildFindFilter(criteria);

      const invitation = await InvitationModel.findOne(filter).exec();

      return invitation ? this.toInvitation(invitation) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findPending(criteria: FindInvitationCriteria): Promise<Invitation | null> {
    try {
      const filter = this.buildFindFilter(criteria);
      filter.status = "pending";
      filter.expiresAt = { $gt: new Date() };

      const invitation = await InvitationModel.findOne(filter).exec();

      return invitation ? this.toInvitation(invitation) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findMany(
    criteria: FindManyInvitationsCriteria,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<Invitation>> {
    try {
      const limit = Math.max(1, Math.min(options?.limit ?? 50, 100));

      const filter: QueryFilter<IInvitation> = {};

      if (criteria.organizationId) {
        filter.organizationId = toObjectId(criteria.organizationId);
      }

      if (criteria.userId) {
        filter.targetUserId = toObjectId(criteria.userId);
      }

      if (criteria.email) {
        filter.targetEmail = criteria.email.trim().toLowerCase();
      }

      if (criteria.status) {
        filter.status = criteria.status;
      }

      if (criteria.activeOnly) {
        filter.status = "pending";
        filter.expiresAt = { $gt: new Date() };
      }

      if (options?.cursor) {
        filter._id = { $gt: toObjectId(options.cursor) };
      }

      const records = await InvitationModel.find(filter)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .lean<IInvitation[]>()
        .exec();

      const hasNextPage = records.length > limit;
      const pagedRecords = hasNextPage ? records.slice(0, limit) : records;
      const invitations = pagedRecords.map(record => this.toInvitation(record));
      const nextCursor = hasNextPage ? (invitations.at(-1)?.id ?? null) : null;

      return {
        items: invitations,
        nextCursor,
      };
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async create(data: CreateInvitationData): Promise<Invitation> {
    try {
      const invitation = await InvitationModel.create({
        organizationId: toObjectId(data.organizationId),
        roleId: toObjectId(data.roleId),
        targetType: data.targetType,
        ...(data.targetEmail && {
          targetEmail: data.targetEmail.trim().toLowerCase(),
        }),
        ...(data.targetUserId && {
          targetUserId: toObjectId(data.targetUserId),
        }),
        invitedBy: toObjectId(data.invitedBy),
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      });

      return this.toInvitation(invitation);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async update(
    criteria: UpdateInvitationCriteria,
    data: UpdateInvitationData,
  ): Promise<Invitation | null> {
    try {
      const invitation = await InvitationModel.findOneAndUpdate(
        {
          _id: toObjectId(criteria.invitationId),
          organizationId: toObjectId(criteria.organizationId),
        },
        {
          $set: {
            status: data.status,
            actionAt: new Date(),
            ...(data.actionBy && { actionBy: toObjectId(data.actionBy) }),
          },
        },
        {
          returnDocument: "after",
          runValidators: true,
        },
      )
        .lean<IInvitation>()
        .exec();

      return invitation ? this.toInvitation(invitation) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async revoke(criteria: RevokeInvitationCriteria): Promise<Invitation | null> {
    try {
      const invitation = await InvitationModel.findOneAndUpdate(
        {
          _id: toObjectId(criteria.invitationId),
          organizationId: toObjectId(criteria.organizationId),
          status: "pending",
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            status: "revoked",
            actionAt: new Date(),
            actionBy: toObjectId(criteria.actorId),
          },
        },
        {
          returnDocument: "after",
          runValidators: true,
        },
      )
        .lean<IInvitation>()
        .exec();

      return invitation ? this.toInvitation(invitation) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  private buildFindFilter(
    criteria: FindInvitationCriteria,
  ): QueryFilter<IInvitation> {
    const filter: QueryFilter<IInvitation> = {};

    switch (criteria.by) {
      case "id":
        filter._id = toObjectId(criteria.invitationId);
        if (criteria.organizationId) {
          filter.organizationId = toObjectId(criteria.organizationId);
        }
        break;

      case "tokenHash":
        filter.tokenHash = criteria.tokenHash;
        break;

      case "user":
        filter.targetUserId = toObjectId(criteria.userId);
        filter.organizationId = toObjectId(criteria.organizationId);
        break;

      case "email":
        filter.targetEmail = criteria.email.trim().toLowerCase();
        filter.organizationId = toObjectId(criteria.organizationId);
        break;
    }

    return filter;
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
