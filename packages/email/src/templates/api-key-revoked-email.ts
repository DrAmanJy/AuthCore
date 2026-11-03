import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export interface ApiKeyRevokedEmailData extends OrganizationNotificationEmailData {
  keyName: string;
}

/** API key revoked operation commits. */
export function apiKeyRevokedEmailTemplate(data: ApiKeyRevokedEmailData): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("API key revoked", data.organizationName),
    preheader: "An API key was revoked.",
    heading: "An API key was revoked",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "An API key for your organization was revoked. Requests using that key will no longer be authorized.",
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "API key name", value: data.keyName },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "If this key is used by an integration, update that integration with an authorized replacement. Never send a secret API key by email.",
  });
}
