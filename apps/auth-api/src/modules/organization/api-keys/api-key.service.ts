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
      type: "id",
      value: params.apiKeyId,
      orgId: params.organizationId,
      credentials: false,
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
      type: "key",
      value: keyHash,
      orgId: params.organizationId,
      credentials: false,
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
    const apiKey = await this.apiKeyRepository.find({
      type: "organization",
      value: params.organizationId,
    });

    return apiKey;
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

    return this.apiKeyRepository.create(
      { keyHash, name: params.name, organizationId: params.organizationId },
      params.actorId,
    );
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
    const apiKey = await this.apiKeyRepository.update(
      { type: "key", value: keyHash, orgId: params.organizationId },
      { status: "revoked", revokedAt: new Date() },
    );

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
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
    const apiKey = await this.apiKeyRepository.update(
      { type: "id", value: params.apiKeyId, orgId: params.organizationId },
      { status: "revoked", revokedAt: new Date() },
    );

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }

  async markUsedById(params: {
    apiKeyId: ApiKeyId;
    organizationId: OrganizationId;
  }): Promise<ApiKey> {
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      // params.actorId,
    );
    const apiKey = await this.apiKeyRepository.update(
      { type: "id", value: params.apiKeyId, orgId: params.organizationId },
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
    await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: params.organizationId,
      },
      // params.actorId,
    );
    const keyHash = asKeyHash(hashString(params.key));
    const apiKey = await this.apiKeyRepository.update(
      { type: "key", value: keyHash, orgId: params.organizationId },
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
    const apiKey = await this.apiKeyRepository.delete(
      { type: "id", value: params.apiKeyId, orgId: params.organizationId },
      params.actorId,
    );

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
    const apiKey = await this.apiKeyRepository.delete(
      { type: "key", value: keyHash, orgId: params.organizationId },
      params.actorId,
    );

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    return apiKey;
  }
}
