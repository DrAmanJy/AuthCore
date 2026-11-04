import type { ApiClientStatus } from "../../models/api-key.model.js";
import type { OrganizationId } from "../organization/organization.types.js";
import type { ActorId, CreatedBy } from "../user/user.types.js";

export type ApiKeyId = string & {
  readonly __brand: "ApiKeyId";
};

export type KeyHash = string & {
  readonly __brand: "KeyHash";
};

export const asApiKeyId = (id: string): ApiKeyId => id as ApiKeyId;
export const asKeyHash = (hash: string): KeyHash => hash as KeyHash;

export type ApiKey = {
  id: ApiKeyId;
  organizationId: OrganizationId;
  name: string;
  status: ApiClientStatus;
  createdBy: CreatedBy;
  lastUsedAt?: Date;
  revokedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ApiKeyCredentials = ApiKey & {
  keyHash: KeyHash;
};

export type FindApiKeyCriteria =
  | {
      by: "id";
      apiKeyId: ApiKeyId;
      organizationId: OrganizationId;
    }
  | {
      by: "keyHash";
      keyHash: KeyHash;
      organizationId?: OrganizationId;
    };

export type FindApiKeyCredentialsCriteria =
  | {
      by: "id";
      apiKeyId: ApiKeyId;
      organizationId: OrganizationId;
    }
  | {
      by: "keyHash";
      keyHash: KeyHash;
      organizationId?: OrganizationId;
    };

export interface FindManyApiKeysCriteria {
  organizationId: OrganizationId;
  status?: ApiClientStatus;
}

export type CreateApiKeyData = {
  organizationId: OrganizationId;
  name: string;
  keyHash: KeyHash;
  actorId: ActorId;
};

export type UpdateApiKeyData = {
  name?: string;
  status?: ApiClientStatus;
  revokedAt?: Date;
  lastUsedAt?: Date;
};

export interface UpdateApiKeyCriteria {
  apiKeyId: ApiKeyId;
  organizationId: OrganizationId;
}

export interface DeleteApiKeyCriteria {
  apiKeyId: ApiKeyId;
  organizationId: OrganizationId;
}
