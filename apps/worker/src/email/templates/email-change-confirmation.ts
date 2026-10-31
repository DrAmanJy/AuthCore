import type { EmailTemplate } from "./email-template.types.js";

export interface EmailChangeConfirmationProps {
  displayName: string;
  newEmail: string;
  confirmUrl: string;
}

export function emailChangeConfirmationTemplate({
  displayName,
  newEmail,
  confirmUrl,
}: EmailChangeConfirmationProps): EmailTemplate {
  const subject = "Confirm your new email address on AuthCore";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 40px 20px;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #edf2f7;">
        <h1 style="margin: 0; font-size: 24px; color: #1a202c;">AuthCore</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #2d3748;">Confirm Email Address Change</h2>
        <p style="color: #4a5568; line-height: 1.6; margin: 0 0 16px;">
          Hi ${displayName}, you requested to update your email address to <strong>${newEmail}</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmUrl}" style="background-color: #3182ce; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Confirm New Email
          </a>
        </div>
        <p style="color: #a0aec0; font-size: 12px; margin: 16px 0 0;">
          If you did not request this change, please contact your organization administrator immediately.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${displayName},\n\nYou requested to update your email address to ${newEmail}.\n\nConfirm your new email here:\n${confirmUrl}`;

  return { subject, html, text };
}
