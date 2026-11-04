import type {
  HardDeleteRepository,
  SoftDeleteRepository,
  StandardRepository,
} from "../repository.contracts.js";
import type {
  ApiKey,
  ApiKeyCredentials,
  CreateApiKeyData,
  DeleteApiKeyCriteria,
  FindApiKeyCredentialsCriteria,
  FindApiKeyCriteria,
  FindManyApiKeysCriteria,
  UpdateApiKeyCriteria,
  UpdateApiKeyData,
} from "./api-key.types.js";

export interface ApiKeyRepository
  extends
    StandardRepository<
      ApiKey,
      FindApiKeyCriteria,
      FindManyApiKeysCriteria,
      CreateApiKeyData,
      UpdateApiKeyCriteria,
      UpdateApiKeyData
    >,
    SoftDeleteRepository<ApiKey, DeleteApiKeyCriteria>,
    HardDeleteRepository<DeleteApiKeyCriteria> {
  findCredentials(
    criteria: FindApiKeyCredentialsCriteria,
  ): Promise<ApiKeyCredentials | null>;

  revoke(criteria: DeleteApiKeyCriteria): Promise<ApiKey | null>;

  rotate(
    criteria: UpdateApiKeyCriteria,
    newKeyHash: string,
  ): Promise<ApiKey | null>;
}
