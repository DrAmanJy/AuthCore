import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export type OrganizationDeletedEmailData = OrganizationNotificationEmailData;

/** Organization soft deletion succeeds. */
export function organizationDeletedEmailTemplate(
  data: OrganizationDeletedEmailData,
): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("Organization deleted", data.organizationName),
    preheader: "Your organization was deleted.",
    heading: "Your organization was deleted",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      `${data.organizationName} was deleted in AuthCore. Access through this organization is no longer available.`,
      "This notification does not confirm deletion of information held in connected applications.",
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "If this deletion was unexpected, contact your administrator. Do not reply with passwords or API keys.",
  });
}
