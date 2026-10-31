import type { EmailTemplate } from "./email-template.types.js";

export interface InvitationEmailProps {
  organizationName: string;
  inviterName: string;
  roleName: string;
  inviteUrl: string;
  expiresAt: string;
}

export function invitationEmailTemplate({
  organizationName,
  inviterName,
  roleName,
  inviteUrl,
  expiresAt,
}: InvitationEmailProps): EmailTemplate {
  const subject = `You have been invited to join ${organizationName} on AuthCore`;

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
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #2d3748;">Organization Invitation</h2>
        <p style="color: #4a5568; line-height: 1.6; margin: 0 0 16px;">
          <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${roleName}</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteUrl}" style="background-color: #3182ce; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #718096; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
          This invitation will expire on <strong>${new Date(expiresAt).toLocaleDateString()}</strong>.
        </p>
        <p style="color: #a0aec0; font-size: 12px; margin: 16px 0 0;">
          If you were not expecting this invitation, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `You have been invited to join ${organizationName} on AuthCore by ${inviterName} as a ${roleName}.\n\nAccept your invitation here:\n${inviteUrl}\n\nThis invitation expires on ${expiresAt}.`;

  return { subject, html, text };
}
