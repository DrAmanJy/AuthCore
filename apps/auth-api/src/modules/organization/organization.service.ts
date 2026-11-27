import type {
  ActorId,
  CreateOrganizationData,
  FindManyOptions,
  Organization,
  OrganizationId,
  OrganizationRepository,
  PaginatedResult,
  UpdateOrganizationData,
} from "@authcore/database";
import { logger } from "@authcore/logger";
import type { AuthorizationService } from "./authorization/authorization.service.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import { AppError } from "../../errors/app-error.js";

export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getById(organizationId: OrganizationId, _actorId?: ActorId): Promise<Organization> {
    return this.authorizationService.getValidOrganization({
      by: "id",
      organizationId,
    });
  }

  async getBySlug(slug: string, _actorId?: ActorId): Promise<Organization> {
    return this.authorizationService.getValidOrganization({
      by: "slug",
      slug,
    });
  }

  async getByActor(
    actorId: ActorId,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<Organization>> {
    return this.organizationRepository.findMany(
      {
        by: "actor",
        actorId,
        status: "active",
      },
      options,
    );
  }

  // no Security checks use securely
  async getAll(options?: FindManyOptions): Promise<PaginatedResult<Organization>> {
    return this.organizationRepository.findMany(
      {
        by: "status",
        status: "active",
      },
      options,
    );
  }

  async create(
    actorId: ActorId,
    data: Omit<CreateOrganizationData, "actorId">,
  ): Promise<Organization> {
    const organization = await this.organizationRepository.create({
      ...data,
      actorId,
    });

    logger.info(
      { event: "organization.create.success", actorId, orgId: organization.id },
      "Organization created and creator assigned as Owner",
    );
    return organization;
  }

  async update(
    organization: Organization,
    actorId: ActorId,
    data: Pick<UpdateOrganizationData, "name" | "frontendUrl">,
  ): Promise<Organization> {
    const updatedOrganization = await this.organizationRepository.update(
      { by: "id", organizationId: organization.id },
      data,
    );

    if (!updatedOrganization) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    logger.info(
      {
        event: "organization.update.success",
        actorId,
        organizationId: organization.id,
      },
      "Organization updated successfully",
    );

    return updatedOrganization;
  }

  async updateSlug(
    organizationId: OrganizationId,
    actorId: ActorId,
    slug: string,
  ): Promise<Organization> {
    const organization = await this.authorizationService.getValidOrganization({
      by: "id",
      organizationId,
    });

    const updatedOrganization = await this.organizationRepository.update(
      { by: "id", organizationId },
      { slug },
    );

    if (!updatedOrganization) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    logger.info(
      {
        event: "organization.update.success",
        actorId,
        organizationId: organization.id,
      },
      "Organization slug updated successfully",
    );

    return updatedOrganization;
  }

  async deleteOrganization(
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<Organization> {
    const organizationDeleted = await this.organizationRepository.softDelete({
      by: "id",
      organizationId,
    });

    if (!organizationDeleted) {
      throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
    }
    logger.info(
      { event: "organization.delete.success", actorId, orgId: organizationId },
      "Organization deleted successfully",
    );

    return organizationDeleted;
  }
}
