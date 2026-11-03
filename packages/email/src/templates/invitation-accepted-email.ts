import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export interface InvitationAcceptedEmailData extends OrganizationNotificationEmailData {
  memberName: string;
  roleName: string;
}

/** Invitation acceptance and active membership creation both commit. */
export function invitationAcceptedEmailTemplate(
  data: InvitationAcceptedEmailData,
): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("An invitation was accepted", data.organizationName),
    preheader: "Your invitation was accepted.",
    heading: "Your invitation was accepted",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      `${data.memberName} accepted the invitation to join ${data.organizationName}.`,
    ],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "New member", value: data.memberName },
      { label: "Role", value: data.roleName },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "You are receiving this confirmation because you manage the invitation. Review membership in the app if the change was unexpected.",
  });
}
