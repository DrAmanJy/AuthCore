import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export interface MemberStatusChangedEmailData extends OrganizationNotificationEmailData {
  status: "active" | "suspended" | "removed";
}

/** A member is activated, suspended or removed. */
export function memberStatusChangedEmailTemplate(
  data: MemberStatusChangedEmailData,
): EmailTemplate {
  const descriptions = {
    active: "Your membership has been activated.",
    suspended: "Your membership has been suspended.",
    removed: "Your membership has been removed.",
  } as const;
  return renderEmail({
    subject: organizationSubject(
      "Your organization access changed",
      data.organizationName,
    ),
    preheader: "Your organization access changed.",
    heading: "Your organization access changed",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      `${descriptions[data.status]} Organization: ${data.organizationName}.`,
      "This change applies to this organization. It does not describe your access to other organizations.",
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "Membership status", value: data.status },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "Contact the organization administrator if you have questions about this change.",
  });
}
