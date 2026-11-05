import type { QueryFilter, Types } from "mongoose";

import OrganizationModel, {
  type IOrganization,
} from "../../models/organization.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import { mapDatabaseError } from "../../errors/database-error.utils.js";
import type {
  FindManyOptions,
  PaginatedResult,
} from "../repository-pagination.types.js";
import { asUserId } from "../user/user.types.js";
import type { OrganizationRepository } from "./organization-repository.js";
import type {
  CreateOrganizationData,
  DeleteOrganizationCriteria,
  FindManyOrganizationsCriteria,
  FindOrganizationCriteria,
  Organization,
  OrganizationStatus,
  UpdateOrganizationCriteria,
  UpdateOrganizationData,
} from "./organization.types.js";
import { asOrganizationId } from "./organization.types.js";

type MongoOrganizationRecord = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  status: OrganizationStatus;
  frontendUrl: string;
  createdBy: {
    _id: Types.ObjectId;
    displayName: string;
  };
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class MongoOrganizationRepository implements OrganizationRepository {
  async find(criteria: FindOrganizationCriteria): Promise<Organization | null> {
    try {
      const filter: QueryFilter<IOrganization> = {
        deletedAt: { $exists: false },
      };

      if (criteria.by === "id") {
        filter._id = toObjectId(criteria.organizationId);
      } else {
        filter.slug = criteria.slug;
      }

      const organization = await OrganizationModel.findOne(filter)
        .populate({ path: "createdBy", select: "displayName _id" })
        .lean<MongoOrganizationRecord>()
        .exec();

      return organization ? this.toOrganization(organization) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async findMany(
    criteria: FindManyOrganizationsCriteria,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<Organization>> {
    try {
      const filter: QueryFilter<IOrganization> = {
        deletedAt: { $exists: false },
        ...(criteria.actorId && { createdBy: toObjectId(criteria.actorId) }),
        ...(criteria.status && { status: criteria.status }),
      };

      const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);

      if (options?.cursor) {
        filter._id = {
          $gt: toObjectId(options.cursor),
        };
      }

      const records = await OrganizationModel.find(filter)
        .populate({ path: "createdBy", select: "displayName _id" })
        .sort({ _id: 1 })
        .limit(limit + 1)
        .lean<MongoOrganizationRecord[]>()
        .exec();

      const hasNextPage = records.length > limit;
      const pagedRecords = hasNextPage ? records.slice(0, limit) : records;
      const items = pagedRecords.map(record => this.toOrganization(record));
      const nextCursor = hasNextPage ? (items.at(-1)?.id ?? null) : null;

      return {
        items,
        nextCursor,
      };
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async create(data: CreateOrganizationData): Promise<Organization> {
    try {
      const organization = await OrganizationModel.create({
        name: data.name,
        slug: data.slug,
        frontendUrl: data.frontendUrl,
        createdBy: toObjectId(data.actorId),
      });

      const populatedOrganization = await OrganizationModel.findById(organization._id)
        .populate({
          path: "createdBy",
          select: "_id displayName",
        })
        .lean<MongoOrganizationRecord>()
        .exec();

      if (!populatedOrganization) {
        throw new Error("Organization was created but could not be retrieved.");
      }

      return this.toOrganization(populatedOrganization);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async update(
    criteria: UpdateOrganizationCriteria,
    data: UpdateOrganizationData,
  ): Promise<Organization | null> {
    try {
      const filter: QueryFilter<IOrganization> = {
        _id: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
        ...(criteria.actorId && { createdBy: toObjectId(criteria.actorId) }),
      };

      const organization = await OrganizationModel.findOneAndUpdate(
        filter,
        {
          $set: data,
        },
        {
          returnDocument: "after",
          runValidators: true,
        },
      )
        .populate({
          path: "createdBy",
          select: "_id displayName",
        })
        .lean<MongoOrganizationRecord>()
        .exec();

      return organization ? this.toOrganization(organization) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async softDelete(
    criteria: DeleteOrganizationCriteria,
  ): Promise<Organization | null> {
    try {
      const filter: QueryFilter<IOrganization> = {
        _id: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
        ...(criteria.actorId && { createdBy: toObjectId(criteria.actorId) }),
      };

      const organization = await OrganizationModel.findOneAndUpdate(
        filter,
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
          path: "createdBy",
          select: "_id displayName",
        })
        .lean<MongoOrganizationRecord>()
        .exec();

      return organization ? this.toOrganization(organization) : null;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async delete(criteria: DeleteOrganizationCriteria): Promise<boolean> {
    try {
      const filter: QueryFilter<IOrganization> = {
        _id: toObjectId(criteria.organizationId),
        ...(criteria.actorId && { createdBy: toObjectId(criteria.actorId) }),
      };

      const result = await OrganizationModel.findOneAndDelete(filter).exec();
      return Boolean(result);
    } catch (error) {
      throw mapDatabaseError(error);
    }
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
