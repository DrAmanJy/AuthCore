import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export interface ApiKeyCreatedEmailData extends OrganizationNotificationEmailData {
  keyName: string;
}

/** API key created operation commits. */
export function apiKeyCreatedEmailTemplate(data: ApiKeyCreatedEmailData): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("API key created", data.organizationName),
    preheader: "An API key was created.",
    heading: "An API key was created",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "An API key was created for your organization. This email contains only its name, not the secret key.",
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "API key name", value: data.keyName },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "If you did not authorize this key, review API keys in your app and revoke any you do not recognize.",
  });
}
