import type { Request, Response } from "express";

import { asActorId } from "@authcore/database";

import type {
  CreateOrganizationData,
  OrganizationId,
  UpdateOrganizationData,
} from "@authcore/database";

import type { OrganizationService } from "./organization.service.js";
import type { AccessTokenPayload } from "../auth/auth.types.js";
import { sendCreated, sendSuccess } from "../../utils/response.utils.js";
import { AuthenticationError } from "../../errors/authentication-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";

export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {
    this.getOrganizations = this.getOrganizations.bind(this);
    this.createOrganization = this.createOrganization.bind(this);
    this.getOrganizationBySlug = this.getOrganizationBySlug.bind(this);
    this.getOrganization = this.getOrganization.bind(this);
    this.updateOrganization = this.updateOrganization.bind(this);
    this.deleteOrganization = this.deleteOrganization.bind(this);
  }

  // ─────────────────────────────────────────────
  // Organization
  // ─────────────────────────────────────────────

  async getOrganizations(req: Request, res: Response) {
    const { sub } = this.getAuthToken(req);
    const organizations = await this.organizationService.getByActor(asActorId(sub));

    sendSuccess(res, organizations, "Organizations successfully retrieved");
  }

  async createOrganization(
    req: Request<unknown, unknown, CreateOrganizationData>,
    res: Response,
  ) {
    const { sub } = this.getAuthToken(req);
    const { frontendUrl, name, slug } = req.body;

    const organization = await this.organizationService.create(sub, {
      frontendUrl,
      name,
      slug,
    });

    sendCreated(res, organization, "Organization successfully created");
  }

  async getOrganizationBySlug(req: Request<{ slug: string }>, res: Response) {
    const { sub } = this.getAuthToken(req);
    const { slug } = req.params;

    const organization = await this.organizationService.getBySlug(slug, sub);

    sendSuccess(res, organization, "Organization successfully retrieved");
  }

  async getOrganization(req: Request<{ organizationId: OrganizationId }>, res: Response) {
    const { sub } = this.getAuthToken(req);
    const { organizationId } = req.params;

    const organization = await this.organizationService.getById(organizationId, sub);

    sendSuccess(res, organization, "Organization successfully retrieved");
  }

  async updateOrganization(
    req: Request<{ organizationId: OrganizationId }, unknown, UpdateOrganizationData>,
    res: Response,
  ) {
    const { sub } = this.getAuthToken(req);
    const { organizationId } = req.params;
    const { frontendUrl, name } = req.body;

    const organization = await this.organizationService.update(organizationId, sub, {
      frontendUrl,
      name,
    });

    sendSuccess(res, organization, "Organization successfully updated");
  }

  async deleteOrganization(
    req: Request<{ organizationId: OrganizationId }>,
    res: Response,
  ) {
    const { sub } = this.getAuthToken(req);
    const { organizationId } = req.params;

    const organization = await this.organizationService.deleteOrganization(
      organizationId,
      sub,
    );
    sendSuccess(res, organization, "Organization successfully deleted");
  }

  private getAuthToken(req: { token?: AccessTokenPayload }): AccessTokenPayload {
    if (!req.token) {
      throw new AuthenticationError(ERROR_CODES.AUTH_UNAUTHORIZED);
    }
    return req.token;
  }
}
