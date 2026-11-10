import { asKeyHash } from "@authcore/database";
import type {
  ActorId,
  ApiKey,
  ApiKeyRepository,
  ApiKeyId,
  OrganizationId,
} from "@authcore/database";

import { hashString } from "../../../utils/hashString.js";
import { ResourceError } from "../../../errors/resource-error.js";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import type { AuthorizationService } from "../authorization/authorization.service.js";

export class ApiKeyService {
  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getById(params: {
    organizationId: OrganizationId;
    apiKeyId: ApiKeyId;
    actorId: ActorId;
  }): Promise<ApiKey> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      params.actorId,
    );

    const apiKey = await this.apiKeyRepository.find({
      by: "id",
      apiKeyId: params.apiKeyId,
      organizationId: params.organizationId,
    });

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async getByKey(params: {
    organizationId: OrganizationId;
    rawKey: string;
    actorId: ActorId;
  }): Promise<ApiKey> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      params.actorId,
    );

    const keyHash = asKeyHash(hashString(params.rawKey));

    const apiKey = await this.apiKeyRepository.find({
      by: "keyHash",
      keyHash,
      organizationId: params.organizationId,
    });

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async getAllOrganizationKey(params: {
    organizationId: OrganizationId;
    actorId: ActorId;
  }): Promise<ApiKey[]> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      params.actorId,
    );

    const result = await this.apiKeyRepository.findMany({
      organizationId: params.organizationId,
    });

    return result.items;
  }

  async create(params: {
    name: string;
    organizationId: OrganizationId;
    key: string;
    actorId: ActorId;
  }): Promise<ApiKey> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      params.actorId,
    );

    const keyHash = asKeyHash(hashString(params.key));

    return this.apiKeyRepository.create({
      keyHash,
      name: params.name,
      organizationId: params.organizationId,
      actorId: params.actorId,
    });
  }

  async revokeByKey(params: {
    key: string;
    organizationId: OrganizationId;
    actorId: ActorId;
  }): Promise<ApiKey> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      params.actorId,
    );
    const keyHash = asKeyHash(hashString(params.key));
    const apiKey = await this.apiKeyRepository.find({
      by: "keyHash",
      keyHash,
      organizationId: params.organizationId,
    });

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    const revoked = await this.apiKeyRepository.revoke({
      apiKeyId: apiKey.id,
      organizationId: params.organizationId,
    });

    if (!revoked) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return revoked;
  }

  async revokeById(params: {
    apiKeyId: ApiKeyId;
    organizationId: OrganizationId;
    actorId: ActorId;
  }): Promise<ApiKey> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      params.actorId,
    );

    const apiKey = await this.apiKeyRepository.revoke({
      apiKeyId: params.apiKeyId,
      organizationId: params.organizationId,
    });

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async markUsedById(params: {
    apiKeyId: ApiKeyId;
    organizationId: OrganizationId;
  }): Promise<ApiKey> {
    await this.authorizationService.getValidOrganization({
      type: "id",
      value: params.organizationId,
    });

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
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async markUsedByKey(params: {
    key: string;
    organizationId: OrganizationId;
  }): Promise<ApiKey> {
    await this.authorizationService.getValidOrganization({
      type: "id",
      value: params.organizationId,
    });

    const keyHash = asKeyHash(hashString(params.key));
    const existing = await this.apiKeyRepository.find({
      by: "keyHash",
      keyHash,
      organizationId: params.organizationId,
    });

    if (!existing) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
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
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async softDeleteById(params: {
    organizationId: OrganizationId;
    apiKeyId: ApiKeyId;
    actorId: ActorId;
  }): Promise<ApiKey> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      params.actorId,
    );

    const apiKey = await this.apiKeyRepository.softDelete({
      apiKeyId: params.apiKeyId,
      organizationId: params.organizationId,
    });

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async softDeleteByKey(params: {
    organizationId: OrganizationId;
    key: string;
    actorId: ActorId;
  }): Promise<ApiKey> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      params.actorId,
    );

    const keyHash = asKeyHash(hashString(params.key));
    const existing = await this.apiKeyRepository.find({
      by: "keyHash",
      keyHash,
      organizationId: params.organizationId,
    });

    if (!existing) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    const apiKey = await this.apiKeyRepository.softDelete({
      apiKeyId: existing.id,
      organizationId: params.organizationId,
    });

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }
}
