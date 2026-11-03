import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export interface OrganizationUpdatedEmailData extends OrganizationNotificationEmailData {
  changedFields: readonly string[];
}

/** Meaningful settings changes such as name, slug or frontend URL commit; batch fields in one message. */
export function organizationUpdatedEmailTemplate(
  data: OrganizationUpdatedEmailData,
): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("Organization settings changed", data.organizationName),
    preheader: "Organization settings changed.",
    heading: "Organization settings changed",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      `Settings for ${data.organizationName} were updated. Review the changes in your app.`,
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "Updated settings", value: data.changedFields.join(", ") },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "If you did not make this change, open AuthCore from your usual app or saved address and review your account security. Contact your administrator if you need help.",
  });
}
