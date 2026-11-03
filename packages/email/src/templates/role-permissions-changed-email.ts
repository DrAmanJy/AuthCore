import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export interface RolePermissionsChangedEmailData extends OrganizationNotificationEmailData {
  roleName: string;
}

/** A role permissions update commits; notify once per change, not each permission. */
export function rolePermissionsChangedEmailTemplate(
  data: RolePermissionsChangedEmailData,
): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("Role permissions changed", data.organizationName),
    preheader: "Role permissions changed.",
    heading: "Role permissions changed",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      `The permissions assigned to the ${data.roleName} role in ${data.organizationName} were updated.`,
      "These changes may affect what members with this role can do. Review the role in your app.",
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "Role", value: data.roleName },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "If you did not make this change, open AuthCore from your usual app or saved address and review your account security. Contact your administrator if you need help.",
  });
}
