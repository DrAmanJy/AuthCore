import type {
  EmailTemplate,
  PasswordResetEmailTemplateData,
} from "./email-template.types.js";

export function passwordResetEmailTemplate(
  data: PasswordResetEmailTemplateData,
): EmailTemplate {
  return {
    subject: `Reset your password ${data.organizationName ? `| ${data.organizationName}` : ""}`,

    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Reset your password</title>
        </head>

        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center" style="padding:40px 16px;">
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="max-width:600px;background:#ffffff;border-radius:8px;"
                >
                  <tr>
                    <td style="padding:40px;">
                      <h1 style="margin:0 0 24px;font-size:24px;">
                        Reset your password
                      </h1>

                      <p style="margin:0 0 16px;">
                        Hi ${data.displayName},
                      </p>

                     ${
                       data.organizationName &&
                       `<p style="margin:0 0 24px;line-height:1.6;">
                        We received a request to reset the password for your
                        ${data.organizationName} account.
                      </p>`
                     }

                      <p style="margin:0 0 24px;">
                        <a
                          href="${data.resetUrl}"
                          style="display:inline-block;padding:12px 20px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;"
                        >
                          Reset Password
                        </a>
                      </p>

                      <p style="margin:0 0 16px;line-height:1.6;">
                        This link will expire in
                        <strong>${data.expiresAt}</strong>.
                      </p>

                      <p style="margin:0;line-height:1.6;color:#71717a;">
                        If you didn't request a password reset, you can safely
                        ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,

    text: `
Hi ${data.displayName},

${data.organizationName && `We received a request to reset the password for your ${data.organizationName} account.`}

Reset your password here:

${data.resetUrl}

This link will expire in ${data.expiresAt}.

If you didn't request a password reset, you can safely ignore this email.
    `.trim(),
  };
}
