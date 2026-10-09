import type { ApiClientStatus } from "../../models/api-key.model.js";
import type { OrganizationId } from "../organization/organization.types.js";
import type { CreatedBy } from "../user/user.types.js";

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
  | { type: "id"; value: ApiKeyId; credentials: boolean }
  | { type: "key"; value: KeyHash; credentials: boolean }
  | { type: "all"; value: OrganizationId; credentials: boolean };

export type CreateApiKey = Pick<ApiKeyCredentials, "name" | "organizationId" | "keyHash">;

export type UpdateApiKey = Partial<
  Pick<ApiKey, "name" | "status" | "revokedAt" | "lastUsedAt">
>;

export type UpdateApiKeyCriteria =
  | { type: "id"; value: ApiKeyId; organizationId: OrganizationId }
  | { type: "key"; value: KeyHash; organizationId: OrganizationId };

export type DeleteApiKeyCriteria = UpdateApiKeyCriteria;
