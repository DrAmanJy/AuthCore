import type { Request, Response } from "express";

import {
  asActorId,
  asOrganizationId,
  asOrganizationMemberId,
  asRoleId,
} from "@authcore/database";

import type {
  CreateOrganizationData,
  CreateOrganizationMemberData,
  CreateRoleData,
  UpdateOrganizationData,
  UpdateOrganizationMemberData,
  UpdateRoleData,
} from "@authcore/database";

import type { OrganizationService } from "./organization.service.js";
import { sendCreated, sendSuccess } from "../../utils/response.utils.js";

type OrganizationParams = {
  organizationId: string;
};

type MemberParams = {
  organizationId: string;
  memberId: string;
};

type RoleParams = {
  organizationId: string;
  roleId: string;
};

type OrganizationRequest<TBody = unknown> = Request<
  Record<string, never>,
  unknown,
  TBody
>;

type OrganizationByIdRequest<TBody = unknown> = Request<
  OrganizationParams,
  unknown,
  TBody
>;

type MemberRequest<TBody = unknown> = Request<MemberParams, unknown, TBody>;

type RoleRequest<TBody = unknown> = Request<RoleParams, unknown, TBody>;

export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {
    this.getOrganizations = this.getOrganizations.bind(this);
    this.createOrganization = this.createOrganization.bind(this);
    this.getOrganizationBySlug = this.getOrganizationBySlug.bind(this);
    this.getOrganization = this.getOrganization.bind(this);
    this.updateOrganization = this.updateOrganization.bind(this);
    this.deleteOrganization = this.deleteOrganization.bind(this);

    this.getMembers = this.getMembers.bind(this);
    this.createMember = this.createMember.bind(this);
    this.getMember = this.getMember.bind(this);
    this.updateMember = this.updateMember.bind(this);
    this.activateMember = this.activateMember.bind(this);
    this.suspendMember = this.suspendMember.bind(this);
    this.removeMember = this.removeMember.bind(this);

    this.getRoles = this.getRoles.bind(this);
    this.createRole = this.createRole.bind(this);
    this.getRole = this.getRole.bind(this);
    this.updateRole = this.updateRole.bind(this);
    this.deleteRole = this.deleteRole.bind(this);
  }

  // ─────────────────────────────────────────────
  // Organization
  // ─────────────────────────────────────────────

  async getOrganizations(req: Request, res: Response) {
    const { sub } = req.token;
    const organizations = await this.organizationService.getOrganizationsByActor(
      asActorId(sub),
    );

    sendSuccess(res, organizations, "Organizations successfully retrieved");
  }

  async createOrganization(
    req: OrganizationRequest<CreateOrganizationData>,
    res: Response,
  ) {
    const { sub } = req.token;

    const organization = await this.organizationService.createOrganization(
      asActorId(sub),
      req.body,
    );

    sendCreated(res, organization, "Organization successfully created");
  }

  async getOrganizationBySlug(req: Request, res: Response) {
    const { slug } = req.query;

    if (typeof slug !== "string") {
      throw new Error("Slug is required");
    }

    const organization = await this.organizationService.getOrganizationBySlug(slug);

    sendSuccess(res, organization, "Organization successfully retrieved");
  }

  async getOrganization(req: OrganizationByIdRequest, res: Response) {
    const organization = await this.organizationService.getOrganization(
      asOrganizationId(req.params.organizationId),
    );

    sendSuccess(res, organization, "Organization successfully retrieved");
  }

  async updateOrganization(
    req: OrganizationByIdRequest<UpdateOrganizationData>,
    res: Response,
  ) {
    const { sub } = req.token;
    const organization = await this.organizationService.updateOrganization(
      asOrganizationId(req.params.organizationId),
      asActorId(sub),
      req.body,
    );

    sendSuccess(res, organization, "Organization successfully updated");
  }

  async deleteOrganization(req: OrganizationByIdRequest, res: Response) {
    const { sub } = req.token;

    const organization = await this.organizationService.deleteOrganization(
      asOrganizationId(req.params.organizationId),
      asActorId(sub),
    );
    sendSuccess(res, organization, "Organization successfully deleted");
  }

  // ─────────────────────────────────────────────
  // Members
  // ─────────────────────────────────────────────

  async getMembers(req: OrganizationByIdRequest, res: Response) {
    const members = await this.organizationService.getMembers(
      asOrganizationId(req.params.organizationId),
    );

    sendSuccess(res, members, "Organization Members successfully retrieved");
  }

  async createMember(
    req: OrganizationByIdRequest<Omit<CreateOrganizationMemberData, "organizationId">>,
    res: Response,
  ) {
    const { sub } = req.token;
    const member = await this.organizationService.addMember(
      asOrganizationId(req.params.organizationId),
      asActorId(sub),
      req.body,
    );

    sendCreated(res, member, "Organization Member successfully created");
  }

  async getMember(req: MemberRequest, res: Response) {
    const member = await this.organizationService.getMember(
      asOrganizationId(req.params.organizationId),
      asOrganizationMemberId(req.params.memberId),
    );

    sendSuccess(res, member, "Organization Member successfully retrieved");
  }

  async updateMember(req: MemberRequest<UpdateOrganizationMemberData>, res: Response) {
    const { sub } = req.token;
    const member = await this.organizationService.updateMember(
      asOrganizationId(req.params.organizationId),
      asOrganizationMemberId(req.params.memberId),
      asActorId(sub),
      req.body,
    );

    sendSuccess(res, member, "Organization Member successfully updated");
  }

  async activateMember(req: MemberRequest, res: Response) {
    const { sub } = req.token;
    const member = await this.organizationService.activateMember(
      asOrganizationId(req.params.organizationId),
      asOrganizationMemberId(req.params.memberId),
      asActorId(sub),
    );

    sendSuccess(res, member, "Organization Member successfully activated");
  }

  async suspendMember(req: MemberRequest, res: Response) {
    const { sub } = req.token;
    const member = await this.organizationService.suspendMember(
      asOrganizationId(req.params.organizationId),
      asOrganizationMemberId(req.params.memberId),
      asActorId(sub),
    );

    sendSuccess(res, member, "Organization Member successfully suspended");
  }

  async removeMember(req: MemberRequest, res: Response) {
    const { sub } = req.token;
    const member = await this.organizationService.removeMember(
      asOrganizationId(req.params.organizationId),
      asOrganizationMemberId(req.params.memberId),
      asActorId(sub),
    );

    sendSuccess(res, member, "Organization Member successfully removed");
  }

  // ─────────────────────────────────────────────
  // Roles
  // ─────────────────────────────────────────────

  async getRoles(req: OrganizationByIdRequest, res: Response) {
    const roles = await this.organizationService.getRoles(
      asOrganizationId(req.params.organizationId),
    );

    sendSuccess(res, roles, "Roles successfully retrieved");
  }

  async createRole(
    req: OrganizationByIdRequest<Omit<CreateRoleData, "organizationId">>,
    res: Response,
  ) {
    const { sub } = req.token;
    const role = await this.organizationService.createRole(
      asOrganizationId(req.params.organizationId),
      asActorId(sub),
      req.body,
    );

    sendCreated(res, role, "Role successfully created");
  }

  async getRole(req: RoleRequest, res: Response) {
    const role = await this.organizationService.getRole(
      asOrganizationId(req.params.organizationId),
      asRoleId(req.params.roleId),
    );

    sendSuccess(res, role, "Role successfully retrieved");
  }

  async updateRole(req: RoleRequest<UpdateRoleData>, res: Response) {
    const { sub } = req.token;
    const role = await this.organizationService.updateRole(
      asOrganizationId(req.params.organizationId),
      asRoleId(req.params.roleId),
      asActorId(sub),
      req.body,
    );

    sendSuccess(res, role, "Role successfully updated");
  }

  async deleteRole(req: RoleRequest, res: Response) {
    const { sub } = req.token;
    const role = await this.organizationService.deleteRole(
      asOrganizationId(req.params.organizationId),
      asRoleId(req.params.roleId),
      asActorId(sub),
    );

    sendSuccess(res, role, "Role successfully deleted");
  }
}
