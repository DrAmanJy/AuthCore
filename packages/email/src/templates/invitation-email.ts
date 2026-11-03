import type { EmailPresentationData, EmailTemplate } from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export interface InvitationEmailProps extends EmailPresentationData {
  organizationName: string;
  inviterName: string;
  roleName: string;
  inviteUrl: string;
  expiresAt: string;
  displayName?: string;
}

/** Organization sends an invitation to a user or email address. */
export function invitationEmailTemplate(data: InvitationEmailProps): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("You are invited", data.organizationName),
    preheader: "You are invited to join.",
    heading: "You are invited to join",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      `${data.inviterName} invited you to join ${data.organizationName}.`,
      "Review the invitation before deciding whether to join.",
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "Invited role", value: data.roleName },
      { label: "Invitation expires", value: emailDate(data.expiresAt) },
    ],
    action: { label: "Review invitation", url: data.inviteUrl },
    notice:
      "If you were not expecting this invitation, you can ignore it. Only accept invitations from organizations you recognize.",
  });
}
