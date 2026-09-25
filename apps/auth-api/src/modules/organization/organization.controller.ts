import type { Request, Response } from "express";

import { asOrganizationId, asOrganizationMemberId, asRoleId } from "@authcore/database";

import type {
  CreateOrganizationData,
  CreateOrganizationMemberData,
  CreateRoleData,
  UpdateOrganizationData,
  UpdateOrganizationMemberData,
  UpdateRoleData,
} from "@authcore/database";

import type { OrganizationService } from "./organization.service.js";

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

  async getOrganizations(_req: Request, res: Response) {
    const organizations = await this.organizationService.getOrganizations();

    return res.status(200).json({
      data: { organizations },
    });
  }

  async createOrganization(
    req: OrganizationRequest<CreateOrganizationData>,
    res: Response,
  ) {
    const organization = await this.organizationService.createOrganization(req.body);

    return res.status(201).json({
      message: "Organization created successfully",
      data: { organization },
    });
  }

  async getOrganizationBySlug(req: Request, res: Response) {
    const { slug } = req.query;

    if (typeof slug !== "string") {
      throw new Error("Slug is required");
    }

    const organization = await this.organizationService.getOrganizationBySlug(slug);

    return res.status(200).json({
      data: { organization },
    });
  }

  async getOrganization(req: OrganizationByIdRequest, res: Response) {
    const organization = await this.organizationService.getOrganization(
      asOrganizationId(req.params.organizationId),
    );

    return res.status(200).json({
      data: { organization },
    });
  }

  async updateOrganization(
    req: OrganizationByIdRequest<UpdateOrganizationData>,
    res: Response,
  ) {
    const organization = await this.organizationService.updateOrganization(
      asOrganizationId(req.params.organizationId),
      req.body,
    );

    return res.status(200).json({
      message: "Organization updated successfully",
      data: { organization },
    });
  }

  async deleteOrganization(req: OrganizationByIdRequest, res: Response) {
    const organization = await this.organizationService.deleteOrganization(
      asOrganizationId(req.params.organizationId),
    );

    return res.status(200).json({
      message: "Organization deleted successfully",
      data: { organization },
    });
  }

  // ─────────────────────────────────────────────
  // Members
  // ─────────────────────────────────────────────

  async getMembers(req: OrganizationByIdRequest, res: Response) {
    const members = await this.organizationService.getMembers(
      asOrganizationId(req.params.organizationId),
    );

    return res.status(200).json({
      data: { members },
    });
  }

  async createMember(
    req: OrganizationByIdRequest<Omit<CreateOrganizationMemberData, "organizationId">>,
    res: Response,
  ) {
    const member = await this.organizationService.addMember({
      organizationId: asOrganizationId(req.params.organizationId),
      ...req.body,
    });

    return res.status(201).json({
      message: "Organization member created successfully",
      data: { member },
    });
  }

  async getMember(req: MemberRequest, res: Response) {
    const member = await this.organizationService.getMember(
      asOrganizationId(req.params.organizationId),
      asOrganizationMemberId(req.params.memberId),
    );

    return res.status(200).json({
      data: { member },
    });
  }

  async updateMember(req: MemberRequest<UpdateOrganizationMemberData>, res: Response) {
    const member = await this.organizationService.updateMember(
      asOrganizationId(req.params.organizationId),
      asOrganizationMemberId(req.params.memberId),
      req.body,
    );

    return res.status(200).json({
      message: "Organization member updated successfully",
      data: { member },
    });
  }

  async activateMember(req: MemberRequest, res: Response) {
    const member = await this.organizationService.activateMember(
      asOrganizationId(req.params.organizationId),
      asOrganizationMemberId(req.params.memberId),
    );

    return res.status(200).json({
      message: "Organization member activated successfully",
      data: { member },
    });
  }

  async suspendMember(req: MemberRequest, res: Response) {
    const member = await this.organizationService.suspendMember(
      asOrganizationId(req.params.organizationId),
      asOrganizationMemberId(req.params.memberId),
    );

    return res.status(200).json({
      message: "Organization member suspended successfully",
      data: { member },
    });
  }

  async removeMember(req: MemberRequest, res: Response) {
    const member = await this.organizationService.removeMember(
      asOrganizationId(req.params.organizationId),
      asOrganizationMemberId(req.params.memberId),
    );

    return res.status(200).json({
      message: "Organization member removed successfully",
      data: { member },
    });
  }

  // ─────────────────────────────────────────────
  // Roles
  // ─────────────────────────────────────────────

  async getRoles(req: OrganizationByIdRequest, res: Response) {
    const roles = await this.organizationService.getRoles(
      asOrganizationId(req.params.organizationId),
    );

    return res.status(200).json({
      data: { roles },
    });
  }

  async createRole(
    req: OrganizationByIdRequest<Omit<CreateRoleData, "organizationId">>,
    res: Response,
  ) {
    const role = await this.organizationService.createRole({
      organizationId: asOrganizationId(req.params.organizationId),
      ...req.body,
    });

    return res.status(201).json({
      message: "Role created successfully",
      data: { role },
    });
  }

  async getRole(req: RoleRequest, res: Response) {
    const role = await this.organizationService.getRole(
      asOrganizationId(req.params.organizationId),
      asRoleId(req.params.roleId),
    );

    return res.status(200).json({
      data: { role },
    });
  }

  async updateRole(req: RoleRequest<UpdateRoleData>, res: Response) {
    const role = await this.organizationService.updateRole(
      asOrganizationId(req.params.organizationId),
      asRoleId(req.params.roleId),
      req.body,
    );

    return res.status(200).json({
      message: "Role updated successfully",
      data: { role },
    });
  }

  async deleteRole(req: RoleRequest, res: Response) {
    const role = await this.organizationService.deleteRole(
      asOrganizationId(req.params.organizationId),
      asRoleId(req.params.roleId),
    );

    return res.status(200).json({
      message: "Role deleted successfully",
      data: { role },
    });
  }
}
