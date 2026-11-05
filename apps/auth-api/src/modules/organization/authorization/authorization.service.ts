import type { ApiKeyRepository } from "@authcore/database";
import type {
  Organization,
  OrganizationId,
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
    criteria:
      | FindOrganizationCriteria
      | { type: "id"; value: OrganizationId }
      | { type: "slug"; value: string },
    owner?: UserId,
  ): Promise<Organization> {
    const normalizedCriteria: FindOrganizationCriteria =
      "by" in criteria
        ? criteria
        : criteria.type === "id"
          ? { by: "id", organizationId: criteria.value }
          : { by: "slug", slug: criteria.value };

    const organization = await this.organizationRepository.find(normalizedCriteria);

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
      by: "keyHash",
      keyHash,
    });

    if (!apiKey) {
      throw new ResourceError(ERROR_CODES.API_KEY_NOT_FOUND);
    }

    await this.getValidOrganization({
      by: "id",
      organizationId: apiKey.organizationId,
    });

    return apiKey;
  }
}
