import type { Types } from "mongoose";

import OrganizationModel from "../../models/organization.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";

import type {
  CreateOrganizationData,
  DeleteOrganizationCriteria,
  FindOrganizationCriteria,
  OrganizationStatus,
  Organization,
  OrganizationId,
  UpdateOrganizationData,
} from "./organization.types.js";
import { asOrganizationId } from "./organization.types.js";
import type { ActorId } from "../user/user.types.js";
import { asUserId } from "../user/user.types.js";
import type { OrganizationRepository } from "./organization-repository.js";
import { mapDatabaseError } from "../../errors/database-error.utils.js";

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
  find(criteria: { type: "all" }): Promise<Organization[]>;

  find(criteria: { type: "actor"; value: ActorId }): Promise<Organization[]>;

  find(criteria: { type: "id"; value: OrganizationId }): Promise<Organization | null>;

  find(criteria: { type: "slug"; value: string }): Promise<Organization | null>;

  async find(
    criteria: FindOrganizationCriteria,
  ): Promise<Organization[] | Organization | null> {
    try {
      switch (criteria.type) {
        case "all": {
          const organizations = await OrganizationModel.find({
            deletedAt: { $exists: false },
          })
            .populate({ path: "createdBy", select: "displayName _id" })
            .lean<MongoOrganizationRecord[]>()
            .exec();

          return organizations.map(organization => this.toOrganization(organization));
        }
        case "actor": {
          const organizations = await OrganizationModel.find({
            createdBy: criteria.value,
            deletedAt: { $exists: false },
          })
            .populate({ path: "createdBy", select: "displayName _id" })
            .lean<MongoOrganizationRecord[]>()
            .exec();
          return organizations.map(organization => this.toOrganization(organization));
        }
        case "id": {
          const organization = await OrganizationModel.findOne({
            _id: toObjectId(criteria.value),
            deletedAt: { $exists: false },
          })
            .populate({ path: "createdBy", select: "displayName _id" })
            .lean<MongoOrganizationRecord>()
            .exec();

          return organization ? this.toOrganization(organization) : null;
        }
        case "slug": {
          const organization = await OrganizationModel.findOne({
            slug: criteria.value,
            deletedAt: { $exists: false },
          })
            .populate({ path: "createdBy", select: "displayName _id" })
            .lean<MongoOrganizationRecord>()
            .exec();

          return organization ? this.toOrganization(organization) : null;
        }
      }
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async create(actorId: ActorId, data: CreateOrganizationData): Promise<Organization> {
    const organization = await OrganizationModel.create({
      ...data,
      createdBy: toObjectId(actorId),
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
  }

  async update(
    organizationId: OrganizationId,
    actorId: ActorId,
    data: UpdateOrganizationData,
  ): Promise<Organization | null> {
    const organization = await OrganizationModel.findOneAndUpdate(
      {
        _id: toObjectId(organizationId),
        createdBy: toObjectId(actorId),
        deletedAt: { $exists: false },
      },
      {
        $set: data,
      },
      {
        new: true,
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
  }

  async softDelete(
    criteria: DeleteOrganizationCriteria,
    actorId: ActorId,
  ): Promise<Organization | null> {
    const search = {
      createdBy: toObjectId(actorId),
      deletedAt: { $exists: false },
      ...(criteria.type === "id"
        ? { _id: toObjectId(criteria.value) }
        : { slug: criteria.value }),
    };

    const organization = await OrganizationModel.findOneAndUpdate(
      search,
      {
        $set: {
          deletedAt: new Date(),
        },
      },
      {
        new: true,
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
