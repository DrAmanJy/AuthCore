import type { OrganizationId } from "../organization/organization.types.js";
import type { ActorId } from "../user/user.types.js";
import type {
  ApiKey,
  ApiKeyCredentials,
  ApiKeyId,
  CreateApiKey,
  DeleteApiKeyCriteria,
  KeyHash,
  UpdateApiKey,
  UpdateApiKeyCriteria,
} from "./api-key.types.js";

export interface ApiKeyRepository {
  find(criteria: {
    type: "id";
    value: ApiKeyId;
    credentials: true;
  }): Promise<ApiKeyCredentials | null>;

  find(criteria: {
    type: "id";
    value: ApiKeyId;
    credentials: false;
  }): Promise<ApiKey | null>;

  find(criteria: {
    type: "key";
    value: KeyHash;
    credentials: true;
  }): Promise<ApiKeyCredentials | null>;

  find(criteria: {
    type: "key";
    value: KeyHash;
    credentials: false;
  }): Promise<ApiKey | null>;

  find(criteria: {
    type: "all";
    value: OrganizationId;
    credentials: true;
  }): Promise<ApiKeyCredentials[]>;

  find(criteria: {
    type: "all";
    value: OrganizationId;
    credentials: false;
  }): Promise<ApiKey[]>;

  create(data: CreateApiKey, actorId: ActorId): Promise<ApiKey>;

  update(
    criteria: UpdateApiKeyCriteria,
    data: UpdateApiKey,
    actorId?: ActorId,
  ): Promise<ApiKey | null>;

  delete(criteria: DeleteApiKeyCriteria, actorId: ActorId): Promise<ApiKey | null>;
}
