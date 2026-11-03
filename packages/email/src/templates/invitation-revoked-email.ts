import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export type InvitationRevokedEmailData = OrganizationNotificationEmailData;

/** A previously delivered pending invitation is revoked. */
export function invitationRevokedEmailTemplate(
  data: InvitationRevokedEmailData,
): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("Your invitation was withdrawn", data.organizationName),
    preheader: "Your invitation was withdrawn.",
    heading: "Your invitation was withdrawn",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      `The invitation to join ${data.organizationName} was withdrawn. That invitation can no longer be accepted.`,
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "If you still need to join, ask the organization administrator for a new invitation.",
  });
}
