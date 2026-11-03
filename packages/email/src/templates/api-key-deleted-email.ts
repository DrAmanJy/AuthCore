import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export interface ApiKeyDeletedEmailData extends OrganizationNotificationEmailData {
  keyName: string;
}

/** API key deleted operation commits. */
export function apiKeyDeletedEmailTemplate(data: ApiKeyDeletedEmailData): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("API key deleted", data.organizationName),
    preheader: "An API key was deleted.",
    heading: "An API key was deleted",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "An API key for your organization was deleted. Requests using that key will no longer be authorized.",
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "API key name", value: data.keyName },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "If this deletion was unexpected, review API keys in your app and contact your administrator. Never send a secret API key by email.",
  });
}
