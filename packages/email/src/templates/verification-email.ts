import type {
  EmailTemplate,
  VerificationEmailTemplateData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

/** Account registration requests mailbox verification. */
export function verificationEmailTemplate(
  data: VerificationEmailTemplateData,
): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("Verify your email address", data.organizationName),
    preheader: "Verify your email address.",
    heading: "Verify your email address",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "Welcome to AuthCore. Verify your email address to finish setting up your account.",
    ],
    details: [{ label: "Link expires", value: emailDate(data.expiresAt) }],
    action: { label: "Verify email address", url: data.verificationUrl },
    notice:
      "If you did not create this account, you can ignore this email. Do not share this verification link.",
  });
}
