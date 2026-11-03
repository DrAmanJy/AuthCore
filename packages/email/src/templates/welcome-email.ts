import type { EmailTemplate, NotificationEmailData } from "./email-template.types.js";
import { renderEmail, emailDate } from "./email-layout.js";

export interface WelcomeEmailData extends NotificationEmailData {
  signInUrl: string;
}

/** Mailbox verification succeeds, once per account. */
export function welcomeEmailTemplate(data: WelcomeEmailData): EmailTemplate {
  return renderEmail({
    subject: "Your email is verified | AuthCore",
    preheader: "Your email is verified.",
    heading: "Your email is verified",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "Your email address has been verified. You can now sign in to AuthCore.",
      "Access to an organization depends on your membership. If you are joining a team, look for an invitation from its administrator.",
    ],
    details: [{ label: "When", value: emailDate(data.occurredAt) }],
    action: { label: "Sign in to AuthCore", url: data.signInUrl },
    notice:
      "If you did not set up this account, contact your administrator before using it.",
  });
}
