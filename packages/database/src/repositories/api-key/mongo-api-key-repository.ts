import type { QueryFilter, Types } from "mongoose";
import type { IApiKey } from "../../models/api-key.model.js";
import { ApiKeyModel } from "../../models/api-key.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import type { ActorId, CreatedBy } from "../user/user.types.js";
import type { ApiKeyRepository } from "./api-key-repository.js";
import type { UpdateApiKeyCriteria } from "./api-key.types.js";
import {
  asApiKeyId,
  type ApiKey,
  type ApiKeyCredentials,
  type ApiKeyId,
  type CreateApiKey,
  type DeleteApiKeyCriteria,
  type FindApiKeyCriteria,
  type KeyHash,
  type UpdateApiKey,
} from "./api-key.types.js";
import type { OrganizationId } from "../organization/organization.types.js";
type Record = Omit<ApiKey, "createdBy" | "id"> & {
  _id: Types.ObjectId;
  createdBy: CreatedBy;
  keyHash: KeyHash;
};
export class MongoApiKeyRepository implements ApiKeyRepository {
  find(criteria: {
    type: "id";
    value: ApiKeyId;
    orgId: OrganizationId;
    credentials: true;
  }): Promise<ApiKeyCredentials | null>;

  find(criteria: {
    type: "id";
    value: ApiKeyId;
    orgId: OrganizationId;
    credentials: false;
  }): Promise<ApiKey | null>;

  find(criteria: {
    type: "key";
    value: KeyHash;
    orgId: OrganizationId;
    credentials: true;
  }): Promise<ApiKeyCredentials | null>;

  find(criteria: {
    type: "key";
    value: KeyHash;
    orgId: OrganizationId;
    credentials: false;
  }): Promise<ApiKey | null>;

  find(criteria: { type: "organization"; value: OrganizationId }): Promise<ApiKey[]>;

  find(criteria: { type: "all" }): Promise<ApiKey[]>;

  async find(
    criteria: FindApiKeyCriteria,
  ): Promise<ApiKey | ApiKey[] | ApiKeyCredentials | ApiKeyCredentials[] | null> {
    switch (criteria.type) {
      case "id":
        return this.findOneRecord(
          {
            _id: toObjectId(criteria.value),
            status: "active",
            organizationId: toObjectId(criteria.orgId),
            revokedAt: { $exists: false },
            deletedAt: { $exists: false },
          },
          criteria.credentials,
        );

      case "key":
        return this.findOneRecord(
          {
            keyHash: criteria.value,
            status: "active",
            ...(criteria.orgId && { organizationId: toObjectId(criteria.orgId) }),
            revokedAt: { $exists: false },
            deletedAt: { $exists: false },
          },
          criteria.credentials,
        );

      case "organization": {
        const apiKeysQuery = ApiKeyModel.find({
          organizationId: toObjectId(criteria.value),
          deletedAt: { $exists: false },
        });

        const apiKeys = await apiKeysQuery
          .populate({
            path: "createdBy",
            select: "_id displayName",
          })
          .lean<Record[]>()
          .exec();

        return apiKeys.map(apiKey => this.toApiKey(apiKey));
      }
      case "all":
        const apiKeysQuery = ApiKeyModel.find({
          deletedAt: { $exists: false },
        });

        const apiKeys = await apiKeysQuery
          .populate({
            path: "createdBy",
            select: "_id displayName",
          })
          .lean<Record[]>()
          .exec();

        return apiKeys.map(apiKey => this.toApiKey(apiKey));
    }
  }

  async create(data: CreateApiKey, actorId: ActorId): Promise<ApiKey> {
    const apiKey = await ApiKeyModel.create({ createdBy: toObjectId(actorId), ...data });

    const apiKeyPopulated = await ApiKeyModel.findById(apiKey._id)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<Record>()
      .exec();

    if (!apiKeyPopulated) {
      throw new Error("Api key was created but could not be retrieved");
    }

    return this.toApiKey(apiKeyPopulated);
  }

  async update(
    criteria: UpdateApiKeyCriteria,
    data: UpdateApiKey,
    actorId: ActorId,
  ): Promise<ApiKey | null> {
    const filter =
      criteria.type === "id"
        ? {
            _id: toObjectId(criteria.value),
            organizationId: toObjectId(criteria.orgId),
            ...(actorId && { createdBy: toObjectId(actorId) }),
            status: "active",
            revokedAt: { $exists: false },
            deletedAt: { $exists: false },
          }
        : { keyHash: criteria.value, createdBy: toObjectId(actorId) };
    const apiKey = await ApiKeyModel.findByIdAndUpdate(filter, data, {
      returnDocument: "after",
      runValidators: true,
    })
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<Record>()
      .exec();

    return apiKey ? this.toApiKey(apiKey) : null;
  }

  async delete(criteria: DeleteApiKeyCriteria, actorId: ActorId): Promise<ApiKey | null> {
    const filter = {
      ...(criteria.type === "id"
        ? { _id: toObjectId(criteria.value) }
        : { keyHash: criteria.value }),
      createdBy: toObjectId(actorId),
      organizationId: toObjectId(criteria.orgId),
    };
    const apiKey = await ApiKeyModel.findOneAndUpdate(filter, { deletedAt: new Date() })
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<Record>()
      .exec();

    return apiKey ? this.toApiKey(apiKey) : null;
  }

  private async findOneRecord(
    filter: QueryFilter<IApiKey>,
    credentials: boolean,
  ): Promise<ApiKey | ApiKeyCredentials | null> {
    const query = ApiKeyModel.findOne({
      ...filter,
      status: "active",
      revokedAt: { $exists: false },
    });

    if (credentials) {
      query.select("+keyHash");
    }

    const record = await query
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<Record>()
      .exec();

    if (!record) return null;

    return credentials ? this.toApiKeyCredentials(record) : this.toApiKey(record);
  }
  toApiKey(record: Record): ApiKey {
    return {
      id: asApiKeyId(record._id.toString()),
      organizationId: record.organizationId,
      name: record.name,
      status: record.status,
      createdBy: record.createdBy,
      ...(record.lastUsedAt && { lastUsedAt: record.lastUsedAt }),
      ...(record.deletedAt && { deletedAt: record.deletedAt }),
      ...(record.revokedAt && { revokedAt: record.revokedAt }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  toApiKeyCredentials(record: Record): ApiKeyCredentials {
    return {
      id: asApiKeyId(record._id.toString()),
      organizationId: record.organizationId,
      name: record.name,
      status: record.status,
      createdBy: record.createdBy,
      ...(record.lastUsedAt && { lastUsedAt: record.lastUsedAt }),
      ...(record.revokedAt && { revokedAt: record.revokedAt }),
      ...(record.deletedAt && { deletedAt: record.deletedAt }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      keyHash: record.keyHash,
    };
  }
}
