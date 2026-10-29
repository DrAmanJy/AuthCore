import type { Request, Response } from "express";
import {
  sendCreated,
  sendNoContent,
  sendSuccess,
} from "../../../utils/response.utils.js";
import getAuthToken from "../../../utils/token.js";
import type { ApiKeyService } from "./api-key.service.js";
import type { ApiKeyId } from "@authcore/database";

export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {
    this.createApiKey = this.createApiKey.bind(this);
    this.getALlOrganizationApiKey = this.getALlOrganizationApiKey.bind(this);
    this.getApiKeyById = this.getApiKeyById.bind(this);
    this.revokeApiKey = this.revokeApiKey.bind(this);
    this.deleteApiKey = this.deleteApiKey.bind(this);
  }

  async createApiKey(
    req: Request<unknown, unknown, { name: string; key: string }>,
    res: Response,
  ) {
    const { sub: actorId, orgId: organizationId } = getAuthToken(req);
    const { name, key } = req.body;

    const apiKey = await this.apiKeyService.create({
      name,
      key,
      organizationId,
      actorId,
    });

    sendCreated(res, apiKey, "Api key created successfully");
  }

  async getALlOrganizationApiKey(req: Request, res: Response) {
    const { sub: actorId, orgId: organizationId } = getAuthToken(req);

    const apiKeys = await this.apiKeyService.getAllOrganizationKey({
      organizationId,
      actorId,
    });

    sendSuccess(res, apiKeys, "All api key successfully retrieved");
  }

  async getApiKeyById(
    req: Request<{ apiKeyId: ApiKeyId }, unknown, unknown>,
    res: Response,
  ) {
    const { sub: actorId, orgId: organizationId } = getAuthToken(req);
    const { apiKeyId } = req.params;

    const apiKeys = await this.apiKeyService.getById({
      organizationId,
      apiKeyId,
      actorId,
    });

    sendSuccess(res, apiKeys, "Api key successfully retrieved");
  }

  async revokeApiKey(req: Request<{ key: string }, unknown, unknown>, res: Response) {
    const { sub: actorId, orgId: organizationId } = getAuthToken(req);

    const { key } = req.params;
    await this.apiKeyService.revokeByKey({ organizationId, key, actorId });

    sendNoContent(res);
  }

  async deleteApiKey(
    req: Request<{ apiKeyId: ApiKeyId }, unknown, unknown>,
    res: Response,
  ) {
    const { sub: actorId, orgId: organizationId } = getAuthToken(req);
    const { apiKeyId } = req.params;

    const apiKey = await this.apiKeyService.softDeleteById({
      apiKeyId,
      organizationId,
      actorId,
    });

    sendSuccess(res, apiKey, "Api key successfully deleted");
  }
}
