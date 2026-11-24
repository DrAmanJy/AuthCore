import { asKeyHash } from "@authcore/database";
import type {
  ActorId,
  ApiKey,
  ApiKeyRepository,
  ApiKeyId,
  FindManyOptions,
  OrganizationId,
  PaginatedResult,
} from "@authcore/database";

import { hashString } from "../../../utils/hashString.js";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import type { AuthorizationService } from "../authorization/authorization.service.js";
import { AppError } from "../../../errors/app-error.js";
import { randomBytes } from "node:crypto";

export class ApiKeyService {
  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getById(params: {
    organizationId: OrganizationId;
    apiKeyId: ApiKeyId;
    actorId?: ActorId;
  }): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.find({
      by: "id",
      apiKeyId: params.apiKeyId,
      organizationId: params.organizationId,
    });

    if (!apiKey) {
      throw new AppError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async getByKey(params: {
    organizationId: OrganizationId;
    rawKey: string;
    actorId?: ActorId;
  }): Promise<ApiKey> {
    const keyHash = asKeyHash(hashString(params.rawKey));

    const apiKey = await this.apiKeyRepository.find({
      by: "keyHash",
      keyHash,
      organizationId: params.organizationId,
    });

    if (!apiKey) {
      throw new AppError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async getAllOrganizationKey(
    params: {
      organizationId: OrganizationId;
      actorId?: ActorId;
    },
    options?: FindManyOptions,
  ): Promise<PaginatedResult<ApiKey>> {
    return this.apiKeyRepository.findMany(
      {
        organizationId: params.organizationId,
      },
      options,
    );
  }

  async create(params: {
    name: string;
    organizationId: OrganizationId;
    actorId: ActorId;
  }): Promise<{ apiKey: ApiKey; key: string }> {
    const key = randomBytes(64).toString("base64url");
    const keyHash = asKeyHash(hashString(key));

    const apiKey = await this.apiKeyRepository.create({
      keyHash,
      name: params.name,
      organizationId: params.organizationId,
      actorId: params.actorId,
    });

    return { apiKey, key };
  }

  async revokeByKey(params: {
    key: string;
    organizationId: OrganizationId;
    actorId?: ActorId;
  }): Promise<ApiKey> {
    const keyHash = asKeyHash(hashString(params.key));
    const apiKey = await this.apiKeyRepository.find({
      by: "keyHash",
      keyHash,
      organizationId: params.organizationId,
    });

    if (!apiKey) {
      throw new AppError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    const revoked = await this.apiKeyRepository.revoke({
      apiKeyId: apiKey.id,
      organizationId: params.organizationId,
    });

    if (!revoked) {
      throw new AppError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return revoked;
  }

  async revokeById(params: {
    apiKeyId: ApiKeyId;
    organizationId: OrganizationId;
    actorId?: ActorId;
  }): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.revoke({
      apiKeyId: params.apiKeyId,
      organizationId: params.organizationId,
    });

    if (!apiKey) {
      throw new AppError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async markUsedById(params: {
    apiKeyId: ApiKeyId;
    organizationId: OrganizationId;
  }): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.update(
      {
        apiKeyId: params.apiKeyId,
        organizationId: params.organizationId,
      },
      {
        lastUsedAt: new Date(),
      },
    );

    if (!apiKey) {
      throw new AppError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async markUsedByKey(params: {
    key: string;
    organizationId: OrganizationId;
  }): Promise<ApiKey> {
    const keyHash = asKeyHash(hashString(params.key));
    const existing = await this.apiKeyRepository.find({
      by: "keyHash",
      keyHash,
      organizationId: params.organizationId,
    });

    if (!existing) {
      throw new AppError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    const apiKey = await this.apiKeyRepository.update(
      {
        apiKeyId: existing.id,
        organizationId: params.organizationId,
      },
      {
        lastUsedAt: new Date(),
      },
    );

    if (!apiKey) {
      throw new AppError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async softDeleteById(params: {
    organizationId: OrganizationId;
    apiKeyId: ApiKeyId;
    actorId?: ActorId;
  }): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.softDelete({
      apiKeyId: params.apiKeyId,
      organizationId: params.organizationId,
    });

    if (!apiKey) {
      throw new AppError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async softDeleteByKey(params: {
    organizationId: OrganizationId;
    key: string;
    actorId?: ActorId;
  }): Promise<ApiKey> {
    const keyHash = asKeyHash(hashString(params.key));
    const existing = await this.apiKeyRepository.find({
      by: "keyHash",
      keyHash,
      organizationId: params.organizationId,
    });

    if (!existing) {
      throw new AppError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    const apiKey = await this.apiKeyRepository.softDelete({
      apiKeyId: existing.id,
      organizationId: params.organizationId,
    });

    if (!apiKey) {
      throw new AppError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }
}
