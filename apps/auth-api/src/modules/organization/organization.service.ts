import type {
  ActorId,
  CreateOrganizationData,
  Organization,
  OrganizationId,
  OrganizationRepository,
  UpdateOrganizationData,
} from "@authcore/database";
import { InternalServerError } from "../../errors/internal-server-error.js";
import { logger } from "@authcore/logger";
import type { AuthorizationService } from "./authorization/authorization.service.js";

export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getById(organizationId: OrganizationId, actorId: ActorId): Promise<Organization> {
    return this.authorizationService.getValidOrganization(
      {
        by: "id",
        organizationId,
      },
      actorId,
    );
  }

  async getBySlug(slug: string, actorId: ActorId): Promise<Organization> {
    return this.authorizationService.getValidOrganization(
      {
        by: "slug",
        slug,
      },
      actorId,
    );
  }

  async getByActor(actorId: ActorId): Promise<Organization[]> {
    const result = await this.organizationRepository.findMany({ actorId });
    return result.items;
  }

  // no Security checks use securely
  async getAll(): Promise<Organization[]> {
    const result = await this.organizationRepository.findMany({});
    return result.items;
  }

  async create(actorId: ActorId, data: Omit<CreateOrganizationData, "actorId">): Promise<Organization> {
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
    organizationId: OrganizationId,
    actorId: ActorId,
    data: Pick<UpdateOrganizationData, "name" | "frontendUrl">,
  ): Promise<Organization> {
    const organization = await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: organizationId,
      },
      actorId,
    );

    const updatedOrganization = await this.organizationRepository.update(
      { organizationId, actorId },
      data,
    );

    if (!updatedOrganization) {
      throw new InternalServerError();
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
    const organization = await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: organizationId,
      },
      actorId,
    );

    const updatedOrganization = await this.organizationRepository.update(
      { organizationId, actorId },
      { slug },
    );

    if (!updatedOrganization) {
      throw new InternalServerError();
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
    const organization = await this.authorizationService.getValidOrganization(
      {
        type: "id",
        value: organizationId,
      },
      actorId,
    );

    const organizationDeleted = await this.organizationRepository.softDelete({
      organizationId,
      actorId,
    });

    if (!organizationDeleted) {
      throw new InternalServerError();
    }
    logger.info(
      { event: "organization.delete.success", actorId, orgId: organization.id },
      "Organization deleted successfully",
    );

    return organizationDeleted;
  }
}
