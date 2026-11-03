import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export interface MemberRoleChangedEmailData extends OrganizationNotificationEmailData {
  previousRoleName: string;
  roleName: string;
}

/** Member role change commits. */
export function memberRoleChangedEmailTemplate(
  data: MemberRoleChangedEmailData,
): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("Your organization role changed", data.organizationName),
    preheader: "Your role has changed.",
    heading: "Your role has changed",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      `Your role in ${data.organizationName} was changed. Your available features may change with your role.`,
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "Previous role", value: data.previousRoleName },
      { label: "New role", value: data.roleName },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice: "If this change was unexpected, contact your organization administrator.",
  });
}
