import type { QueryFilter, Types } from "mongoose";

import type { IMember } from "../../models/member.model.js";
import MemberModel from "../../models/member.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import type { Organization } from "../organization/organization.types.js";
import {
  asOrganizationId,
  type OrganizationId,
} from "../organization/organization.types.js";
import type { FindManyOptions, PaginatedResult } from "../repository-pagination.types.js";
import { asRoleId } from "../role/role.types.js";
import type { UserId } from "../user/user.types.js";
import { asUserId } from "../user/user.types.js";
import type { MemberRepository } from "./organization-member-repository.js";
import type {
  CreateMemberData,
  DeleteMemberCriteria,
  ExistCriteria,
  FindManyMembersCriteria,
  FindMemberCriteria,
  Member,
  UpdateMemberCriteria,
  UpdateMemberData,
} from "./organization-member.types.js";
import { asMemberId } from "./organization-member.types.js";
import type { MongoOrganizationRecord } from "../organization/mongo-organization-repository.js";

type MongoMemberRecord = Pick<
  IMember,
  | "_id"
  | "organizationId"
  | "userId"
  | "roleId"
  | "status"
  | "joinedAt"
  | "isOwner"
  | "deletedAt"
  | "createdAt"
  | "updatedAt"
> & {
  invitedBy: {
    _id: Types.ObjectId;
    displayName: string;
  };
};

export class MongoMemberRepository implements MemberRepository {
  async exists(criteria: ExistCriteria): Promise<boolean> {
    const hasAssignedMembers = await MemberModel.exists({
      organizationId: criteria.organizationId,
      roleId: criteria.roleId,
      status: { $in: criteria.status },
    })
      .lean()
      .exec();

    return hasAssignedMembers ? true : false;
  }
  async find(criteria: FindMemberCriteria): Promise<Member | null> {
    const filter: QueryFilter<IMember> = {
      organizationId: toObjectId(criteria.organizationId),
      deletedAt: { $exists: false },
      ...(criteria.by === "id"
        ? { _id: toObjectId(criteria.memberId) }
        : { userId: toObjectId(criteria.userId) }),
    };

    const member = await MemberModel.findOne(filter)
      .populate({
        path: "invitedBy",
        select: "_id displayName",
      })
      .lean<MongoMemberRecord>()
      .exec();

    return member ? this.toMember(member) : null;
  }

  async findOwners(organizationId: OrganizationId): Promise<Member[]> {
    const members = await MemberModel.find({
      organizationId: toObjectId(organizationId),
      deletedAt: { $exists: false },
      isOwner: true,
    })
      .populate({
        path: "invitedBy",
        select: "_id displayName",
      })
      .lean<MongoMemberRecord[]>()
      .exec();

    return members.map(m => this.toMember(m));
  }

  async findUserOrganizations(userId: UserId): Promise<Organization[]> {
    const organizations = await MemberModel.aggregate<MongoOrganizationRecord>([
      {
        $match: {
          userId: toObjectId(userId),
          status: "active",
        },
      },
      {
        $lookup: {
          from: "organizations",
          localField: "organizationId",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                status: "active",
                deletedAt: null,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      displayName: 1,
                    },
                  },
                ],
                as: "createdBy",
              },
            },
            {
              $unwind: {
                path: "$createdBy",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                slug: 1,
                status: 1,
                frontendUrl: 1,
                createdBy: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          as: "organization",
        },
      },
      {
        $unwind: "$organization",
      },
      {
        $replaceRoot: {
          newRoot: "$organization",
        },
      },
    ]);

    return organizations.map(organization => this.toOrganization(organization));
  }

  async findMany(
    criteria: FindManyMembersCriteria,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<Member>> {
    const filter: QueryFilter<IMember> = {
      organizationId: toObjectId(criteria.organizationId),
      deletedAt: { $exists: false },
      ...(criteria.roleId && { roleId: toObjectId(criteria.roleId) }),
      ...(criteria.status && { status: criteria.status }),
    };

    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);

    if (options?.cursor) {
      filter._id = {
        $gt: toObjectId(options.cursor),
      };
    }

    const records = await MemberModel.find(filter)
      .populate({
        path: "invitedBy",
        select: "_id displayName",
      })
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean<MongoMemberRecord[]>()
      .exec();

    const hasNextPage = records.length > limit;
    const pagedRecords = hasNextPage ? records.slice(0, limit) : records;
    const items = pagedRecords.map(record => this.toMember(record));
    const nextCursor = hasNextPage ? (items.at(-1)?.id ?? null) : null;

    return {
      items,
      nextCursor,
    };
  }

  async create(data: CreateMemberData): Promise<Member> {
    const organizationMember = await MemberModel.create({
      organizationId: toObjectId(data.organizationId),
      userId: toObjectId(data.userId),
      roleId: toObjectId(data.roleId),
      invitedBy: toObjectId(data.actorId),
      status: data.status,
      ...(data.isOwner && { isOwner: data.isOwner }),
      ...(data.joinedAt && { joinedAt: data.joinedAt }),
    });

    const populatedOrganizationMember = await MemberModel.findById(organizationMember._id)
      .populate({
        path: "invitedBy",
        select: "_id displayName",
      })
      .lean<MongoMemberRecord>()
      .exec();

    if (!populatedOrganizationMember) {
      throw new Error("Organization member was created but could not be retrieved.");
    }

    return this.toMember(populatedOrganizationMember);
  }

  async update(
    criteria: UpdateMemberCriteria,
    data: UpdateMemberData,
  ): Promise<Member | null> {
    const organizationMember = await MemberModel.findOneAndUpdate(
      {
        _id: toObjectId(criteria.memberId),
        organizationId: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
      },
      {
        $set: {
          ...(data.roleId && { roleId: toObjectId(data.roleId) }),
          ...(data.status && { status: data.status }),
          ...(typeof data.isOwner === "boolean" && { isOwner: data.isOwner }),
          ...(data.joinedAt && { joinedAt: data.joinedAt }),
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    )
      .populate({
        path: "invitedBy",
        select: "_id displayName",
      })
      .lean<MongoMemberRecord>()
      .exec();

    return organizationMember ? this.toMember(organizationMember) : null;
  }

  async softDelete(criteria: DeleteMemberCriteria): Promise<Member | null> {
    const member = await MemberModel.findOneAndUpdate(
      {
        _id: toObjectId(criteria.memberId),
        organizationId: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
      },
      {
        $set: {
          deletedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    )
      .populate({
        path: "invitedBy",
        select: "_id displayName",
      })
      .lean<MongoMemberRecord>()
      .exec();

    return member ? this.toMember(member) : null;
  }

  async delete(criteria: DeleteMemberCriteria): Promise<boolean> {
    const result = await MemberModel.findOneAndDelete({
      _id: toObjectId(criteria.memberId),
      organizationId: toObjectId(criteria.organizationId),
    }).exec();

    return Boolean(result);
  }

  private toMember(record: MongoMemberRecord): Member {
    return {
      id: asMemberId(record._id.toString()),

      organizationId: asOrganizationId(record.organizationId.toString()),
      userId: asUserId(record.userId.toString()),
      roleId: asRoleId(record.roleId.toString()),
      status: record.status,
      invitedBy: {
        id: asUserId(record.invitedBy._id.toString()),
        displayName: record.invitedBy.displayName,
      },
      ...(record.joinedAt !== undefined && {
        joinedAt: record.joinedAt,
      }),
      isOwner: record.isOwner,
      ...(record.deletedAt !== undefined && {
        deletedAt: record.deletedAt,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toOrganization(record: MongoOrganizationRecord): Organization {
    return {
      id: asOrganizationId(record._id.toString()),
      name: record.name,
      slug: record.slug,
      status: record.status,
      frontendUrl: record.frontendUrl,

      ...(record.deletedAt !== undefined && {
        deletedAt: record.deletedAt,
      }),

      createdBy: {
        id: asUserId(record.createdBy._id.toString()),
        displayName: record.createdBy.displayName,
      },

      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
