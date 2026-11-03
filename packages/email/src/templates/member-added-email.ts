import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export interface MemberAddedEmailData extends OrganizationNotificationEmailData {
  roleName: string;
  membershipStatus: "invited" | "active";
}

/** Direct membership creation succeeds; invitation acceptance uses its own confirmation to avoid duplicates. */
export function memberAddedEmailTemplate(data: MemberAddedEmailData): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("Your membership was created", data.organizationName),
    preheader: "Your organization membership.",
    heading: "Your organization membership",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      `A membership was created for you in ${data.organizationName}.`,
      data.membershipStatus === "active"
        ? "Your membership is active. Available features depend on your assigned role."
        : "Your membership is awaiting acceptance. Use the invitation email from this organization to review and accept it.",
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "Role", value: data.roleName },
      { label: "Membership status", value: data.membershipStatus },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "If you do not recognize this organization, contact its administrator. You do not need to share your password to join a team.",
  });
}
