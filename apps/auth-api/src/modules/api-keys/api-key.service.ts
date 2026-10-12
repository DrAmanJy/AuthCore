import { asKeyHash } from "@authcore/database";
import type {
  ActorId,
  ApiKey,
  ApiKeyRepository,
  DeleteApiKeyCriteria,
  ApiKeyId,
  OrganizationId,
} from "@authcore/database";

import { hashString } from "../../utils/hashString.js";
import { ResourceError } from "../../errors/resource-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";

export class ApiKeyService {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  async getById(id: ApiKeyId): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.find({
      type: "id",
      value: id,
      credentials: false,
    });

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }
  async getByKey(rawKey: string): Promise<ApiKey> {
    const keyHash = asKeyHash(hashString(rawKey));

    const apiKey = await this.apiKeyRepository.find({
      type: "key",
      value: keyHash,
      credentials: false,
    });

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }
  async getALl(organizationId: OrganizationId): Promise<ApiKey[]> {
    const apiKey = await this.apiKeyRepository.find({
      type: "all",
      value: organizationId,
      credentials: false,
    });

    return apiKey;
  }

  async create(
    name: string,
    organizationId: OrganizationId,
    key: string,
    actorId: ActorId,
  ): Promise<ApiKey> {
    const keyHash = asKeyHash(hashString(key));

    return this.apiKeyRepository.create({ name, organizationId, keyHash }, actorId);
  }

  async revokeByKey(
    rawKey: string,
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<ApiKey> {
    const keyHash = asKeyHash(hashString(rawKey));
    const apiKey = await this.apiKeyRepository.update(
      { type: "key", value: keyHash, organizationId },
      { status: "revoked", revokedAt: new Date() },
      actorId,
    );

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async revokeById(
    id: ApiKeyId,
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.update(
      { type: "id", value: id, organizationId },
      { status: "revoked", revokedAt: new Date() },
      actorId,
    );

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async markUsedById(id: ApiKeyId, organizationId: OrganizationId): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.update(
      { type: "id", value: id, organizationId },
      {
        lastUsedAt: new Date(),
      },
    );

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }
  async markUsedByKey(rawKey: string, organizationId: OrganizationId): Promise<ApiKey> {
    const keyHash = asKeyHash(hashString(rawKey));
    const apiKey = await this.apiKeyRepository.update(
      { type: "key", value: keyHash, organizationId },
      {
        lastUsedAt: new Date(),
      },
    );

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async softDelete(criteria: DeleteApiKeyCriteria, actorId: ActorId): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.delete(criteria, actorId);

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }
}

