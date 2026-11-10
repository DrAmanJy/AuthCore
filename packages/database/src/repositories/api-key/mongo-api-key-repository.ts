import type { QueryFilter, Types } from "mongoose";
import type { IApiKey } from "../../models/api-key.model.js";
import { ApiKeyModel } from "../../models/api-key.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import { asOrganizationId } from "../organization/organization.types.js";
import type { FindManyOptions, PaginatedResult } from "../repository-pagination.types.js";
import { asUserId } from "../user/user.types.js";
import type { ApiKeyRepository } from "./api-key-repository.js";
import {
  asApiKeyId,
  asKeyHash,
  type ApiKey,
  type ApiKeyCredentials,
  type CreateApiKeyData,
  type DeleteApiKeyCriteria,
  type FindApiKeyCredentialsCriteria,
  type FindApiKeyCriteria,
  type FindManyApiKeysCriteria,
  type UpdateApiKeyCriteria,
  type UpdateApiKeyData,
} from "./api-key.types.js";

type MongoApiKeyRecord = Omit<IApiKey, "createdBy" | "organizationId"> & {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  createdBy: {
    _id: Types.ObjectId;
    displayName: string;
  };
};

export class MongoApiKeyRepository implements ApiKeyRepository {
  async find(criteria: FindApiKeyCriteria): Promise<ApiKey | null> {
    const filter: QueryFilter<IApiKey> = {
      deletedAt: { $exists: false },
    };

    if (criteria.by === "id") {
      filter._id = toObjectId(criteria.apiKeyId);
      filter.organizationId = toObjectId(criteria.organizationId);
    } else {
      filter.keyHash = criteria.keyHash;
      if (criteria.organizationId) {
        filter.organizationId = toObjectId(criteria.organizationId);
      }
    }

    const apiKey = await ApiKeyModel.findOne(filter)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoApiKeyRecord>()
      .exec();

    return apiKey ? this.toApiKey(apiKey) : null;
  }

  async findCredentials(
    criteria: FindApiKeyCredentialsCriteria,
  ): Promise<ApiKeyCredentials | null> {
    const filter: QueryFilter<IApiKey> = {
      deletedAt: { $exists: false },
    };

    if (criteria.by === "id") {
      filter._id = toObjectId(criteria.apiKeyId);
      filter.organizationId = toObjectId(criteria.organizationId);
    } else {
      filter.keyHash = criteria.keyHash;
      if (criteria.organizationId) {
        filter.organizationId = toObjectId(criteria.organizationId);
      }
    }

    const apiKey = await ApiKeyModel.findOne(filter)
      .select("+keyHash")
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoApiKeyRecord & { keyHash: string }>()
      .exec();

    return apiKey ? this.toApiKeyCredentials(apiKey) : null;
  }

  async findMany(
    criteria: FindManyApiKeysCriteria,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<ApiKey>> {
    const filter: QueryFilter<IApiKey> = {
      organizationId: toObjectId(criteria.organizationId),
      deletedAt: { $exists: false },
      ...(criteria.status && { status: criteria.status }),
    };

    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);

    if (options?.cursor) {
      filter._id = {
        $gt: toObjectId(options.cursor),
      };
    }

    const records = await ApiKeyModel.find(filter)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean<MongoApiKeyRecord[]>()
      .exec();

    const hasNextPage = records.length > limit;
    const pagedRecords = hasNextPage ? records.slice(0, limit) : records;
    const apiKeys = pagedRecords.map(record => this.toApiKey(record));
    const nextCursor = hasNextPage ? (apiKeys.at(-1)?.id ?? null) : null;

    return {
      items: apiKeys,
      nextCursor,
    };
  }

  async create(data: CreateApiKeyData): Promise<ApiKey> {
    const apiKey = await ApiKeyModel.create({
      organizationId: toObjectId(data.organizationId),
      name: data.name,
      keyHash: data.keyHash,
      createdBy: toObjectId(data.actorId),
      status: "active",
    });

    const apiKeyPopulated = await ApiKeyModel.findById(apiKey._id)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoApiKeyRecord>()
      .exec();

    if (!apiKeyPopulated) {
      throw new Error("API key was created but could not be retrieved");
    }

    return this.toApiKey(apiKeyPopulated);
  }

  async update(
    criteria: UpdateApiKeyCriteria,
    data: UpdateApiKeyData,
  ): Promise<ApiKey | null> {
    const updateQuery: {
      $set?: {
        name?: string;
        status?: string;
        revokedAt?: Date;
        lastUsedAt?: Date;
      };
    } = {};

    if (data.name !== undefined) {
      updateQuery.$set = { ...updateQuery.$set, name: data.name };
    }
    if (data.status !== undefined) {
      updateQuery.$set = { ...updateQuery.$set, status: data.status };
    }
    if (data.revokedAt !== undefined) {
      updateQuery.$set = { ...updateQuery.$set, revokedAt: data.revokedAt };
    }
    if (data.lastUsedAt !== undefined) {
      updateQuery.$set = { ...updateQuery.$set, lastUsedAt: data.lastUsedAt };
    }

    const apiKey = await ApiKeyModel.findOneAndUpdate(
      {
        _id: toObjectId(criteria.apiKeyId),
        organizationId: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
      },
      updateQuery.$set ? updateQuery : {},
      {
        returnDocument: "after",
        runValidators: true,
      },
    )
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoApiKeyRecord>()
      .exec();

    return apiKey ? this.toApiKey(apiKey) : null;
  }

  async softDelete(criteria: DeleteApiKeyCriteria): Promise<ApiKey | null> {
    const apiKey = await ApiKeyModel.findOneAndUpdate(
      {
        _id: toObjectId(criteria.apiKeyId),
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
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoApiKeyRecord>()
      .exec();

    return apiKey ? this.toApiKey(apiKey) : null;
  }

  async delete(criteria: DeleteApiKeyCriteria): Promise<boolean> {
    const result = await ApiKeyModel.findOneAndDelete({
      _id: toObjectId(criteria.apiKeyId),
      organizationId: toObjectId(criteria.organizationId),
    }).exec();

    return Boolean(result);
  }

  async revoke(criteria: DeleteApiKeyCriteria): Promise<ApiKey | null> {
    const apiKey = await ApiKeyModel.findOneAndUpdate(
      {
        _id: toObjectId(criteria.apiKeyId),
        organizationId: toObjectId(criteria.organizationId),
        status: "active",
        deletedAt: { $exists: false },
      },
      {
        $set: {
          status: "revoked",
          revokedAt: new Date(),
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
      .lean<MongoApiKeyRecord>()
      .exec();

    return apiKey ? this.toApiKey(apiKey) : null;
  }

  async rotate(
    criteria: UpdateApiKeyCriteria,
    newKeyHash: string,
  ): Promise<ApiKey | null> {
    const apiKey = await ApiKeyModel.findOneAndUpdate(
      {
        _id: toObjectId(criteria.apiKeyId),
        organizationId: toObjectId(criteria.organizationId),
        status: "active",
        deletedAt: { $exists: false },
      },
      {
        $set: {
          keyHash: newKeyHash,
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
      .lean<MongoApiKeyRecord>()
      .exec();

    return apiKey ? this.toApiKey(apiKey) : null;
  }

  private toApiKey(record: MongoApiKeyRecord): ApiKey {
    return {
      id: asApiKeyId(record._id.toString()),
      organizationId: asOrganizationId(record.organizationId.toString()),
      name: record.name,
      status: record.status,
      createdBy: {
        id: asUserId(record.createdBy._id.toString()),
        displayName: record.createdBy.displayName,
      },
      ...(record.lastUsedAt && { lastUsedAt: record.lastUsedAt }),
      ...(record.deletedAt && { deletedAt: record.deletedAt }),
      ...(record.revokedAt && { revokedAt: record.revokedAt }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toApiKeyCredentials(
    record: MongoApiKeyRecord & { keyHash: string },
  ): ApiKeyCredentials {
    return {
      ...this.toApiKey(record),
      keyHash: asKeyHash(record.keyHash),
    };
  }
}
