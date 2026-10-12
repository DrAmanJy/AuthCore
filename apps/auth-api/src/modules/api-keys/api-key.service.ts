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
}