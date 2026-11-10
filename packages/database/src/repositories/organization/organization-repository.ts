import type {
  HardDeleteRepository,
  SoftDeleteRepository,
  StandardRepository,
} from "../repository.contracts.js";
import type {
  CreateOrganizationData,
  DeleteOrganizationCriteria,
  FindManyOrganizationsCriteria,
  FindOrganizationCriteria,
  Organization,
  UpdateOrganizationCriteria,
  UpdateOrganizationData,
} from "./organization.types.js";

export interface OrganizationRepository
  extends
    StandardRepository<
      Organization,
      FindOrganizationCriteria,
      FindManyOrganizationsCriteria,
      CreateOrganizationData,
      UpdateOrganizationCriteria,
      UpdateOrganizationData
    >,
    SoftDeleteRepository<Organization, DeleteOrganizationCriteria>,
    HardDeleteRepository<DeleteOrganizationCriteria> {}
