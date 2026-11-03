import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export type OrganizationCreatedEmailData = OrganizationNotificationEmailData;

/** Organization creation commits. */
export function organizationCreatedEmailTemplate(
  data: OrganizationCreatedEmailData,
): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("Your organization was created", data.organizationName),
    preheader: "Your organization was created.",
    heading: "Your organization was created",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      `${data.organizationName} was created in AuthCore. You can manage the organization from your app.`,
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "If you did not make this change, open AuthCore from your usual app or saved address and review your account security. Contact your administrator if you need help.",
  });
}
