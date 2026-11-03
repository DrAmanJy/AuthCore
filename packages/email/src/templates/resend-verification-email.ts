import type {
  EmailTemplate,
  ResendVerificationEmailTemplateData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

/** User requests another verification email. */
export function resendVerificationEmailTemplate(
  data: ResendVerificationEmailTemplateData,
): EmailTemplate {
  return renderEmail({
    subject: organizationSubject(
      "Your requested verification link",
      data.organizationName,
    ),
    preheader: "Verify your email address.",
    heading: "Verify your email address",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "Here is the verification email you requested. Use the button below to verify your email address.",
      "If you requested more than one verification email, use the most recent link.",
    ],
    details: [{ label: "Link expires", value: emailDate(data.expiresAt) }],
    action: { label: "Verify email address", url: data.verificationUrl },
    notice:
      "If you did not request this email, you can ignore it. Do not share this verification link.",
  });
}
