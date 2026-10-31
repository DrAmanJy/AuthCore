import type { ApiKeyRepository } from "@authcore/database";
import type {
  Organization,
  OrganizationRepository,
  FindOrganizationCriteria,
  UserId,
  ApiKey,
} from "@authcore/database";
import { asKeyHash } from "@authcore/database";
import { ResourceError } from "../../../errors/resource-error.js";
import { ERROR_CODES } from "../../../errors/error-codes.js";
import { hashString } from "../../../utils/hashString.js";

export class AuthorizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly apiKeyRepository: ApiKeyRepository,
  ) {}

  async getValidOrganization(
    criteria: Exclude<FindOrganizationCriteria, { type: "all" } | { type: "actor" }>,
    owner?: UserId,
  ): Promise<Organization> {
    let organization: Organization | null;

    switch (criteria.type) {
      case "id":
        organization = await this.organizationRepository.find({
          type: "id",
          value: criteria.value,
        });
        break;

      case "slug":
        organization = await this.organizationRepository.find({
          type: "slug",
          value: criteria.value,
        });
        break;
    }

    if (!organization) {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
    }

    if (organization.status !== "active") {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_INACTIVE);
    }
    if (owner && organization.createdBy.id !== owner) {
      throw new ResourceError(ERROR_CODES.ORGANIZATION_CREATOR_ONLY);
    }
    return organization;
  }

  async getByKey(key: string): Promise<ApiKey> {
    const keyHash = asKeyHash(hashString(key));

    const apiKey = await this.apiKeyRepository.find({
      type: "key",
      value: keyHash,
      credentials: false,
    });

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    await this.getValidOrganization({
      type: "id",
      value: apiKey.organizationId,
    });

    return apiKey;
  }
}
