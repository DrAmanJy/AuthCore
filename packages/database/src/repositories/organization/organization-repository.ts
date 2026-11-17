import type {
  HardDeleteRepository,
  SoftDeleteRepository,
  StandardRepository,
} from "../repository.contracts.js";
import type {
  CreateOrganizationData,
  FindManyOrganizationsCriteria,
  FindOrganizationCriteria,
  Organization,
  UpdateOrganizationData,
} from "./organization.types.js";

export interface OrganizationRepository
  extends
    StandardRepository<
      Organization,
      FindOrganizationCriteria,
      FindManyOrganizationsCriteria,
      CreateOrganizationData,
      FindOrganizationCriteria,
      UpdateOrganizationData
    >,
    SoftDeleteRepository<Organization, FindOrganizationCriteria>,
    HardDeleteRepository<FindOrganizationCriteria> {}
