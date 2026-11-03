import type { EmailContent, EmailTemplate } from "./email-template.types.js";

export function emailText(value: string): string {
  return value

    .replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value: string): string {
  return emailText(value).replace(/[&<>"']/g, character => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/** Consistent dates, independent of the rendering worker's locale or timezone. */
export function emailDate(value: string): string {
  const date = new Date(value);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(
      value,
    ) ||
    !Number.isFinite(date.getTime())
  ) {
    throw new TypeError(
      "Email dates must be absolute ISO 8601 timestamps with a timezone.",
    );
  }
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date)} UTC`;
}

/** HTTPS in production; loopback HTTP supports local development previews. */
export function emailUrl(value: string): string {
  if (value !== value.trim() || /\s/.test(value)) {
    throw new TypeError("Email links must be absolute URLs without whitespace.");
  }
  const url = new URL(value);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
  ) {
    throw new TypeError(
      "Email links require HTTPS; HTTP is allowed only on loopback hosts.",
    );
  }
  return url.href;
}

export function organizationSubject(subject: string, organizationName?: string): string {
  return organizationName && emailText(organizationName)
    ? `${subject} | ${emailText(organizationName)}`
    : `${subject} | AuthCore`;
}

const paragraphStyle =
  "margin:0 0 18px;color:#334155;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;word-wrap:break-word;overflow-wrap:anywhere;";

export function renderEmail(content: EmailContent): EmailTemplate {
  const subject = emailText(content.subject);
  const action = content.action && {
    label: emailText(content.action.label),
    url: emailUrl(content.action.url),
  };
  const supportUrl = content.supportUrl ? emailUrl(content.supportUrl) : undefined;
  const greeting =
    content.displayName && emailText(content.displayName)
      ? `Hi ${emailText(content.displayName)},`
      : "Hello,";
  const details = content.details ?? [];
  const help = supportUrl
    ? `Need help? Visit our help page: ${supportUrl}`
    : "Need help? Use the help option in your app or contact your organization administrator.";
  const text = [
    greeting,
    ...content.paragraphs.map(emailText),
    ...details.map(detail => `${emailText(detail.label)}: ${emailText(detail.value)}`),
    ...(action ? [`${action.label}:\n${action.url}`] : []),
    emailText(content.notice),
    help,
    "AuthCore | Account and organization notifications",
  ].join("\n\n");

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    table{border-collapse:collapse}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
    @media screen and (max-width:480px){.outer{padding:20px 12px!important}.content{padding:28px 20px!important}.brand{padding:24px 20px!important}.title{font-size:25px!important;line-height:32px!important}}
  </style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#f1f5f9;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
  <div aria-hidden="true" style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(content.preheader)}</div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9">
    <tr><td class="outer" align="center" style="padding:40px 16px;">
      <!--[if mso]><table role="presentation" width="600" align="center" border="0" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #dbe3ed;">
        <tr><td class="brand" style="padding:28px 32px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-family:Arial,Helvetica,sans-serif;font-size:21px;line-height:28px;font-weight:bold;">AuthCore</td></tr>
        <tr><td class="content" style="padding:36px 32px;">
          <h1 class="title" style="margin:0 0 24px;color:#0f172a;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:36px;font-weight:bold;word-wrap:break-word;overflow-wrap:anywhere;">${escapeHtml(content.heading)}</h1>
          <p style="${paragraphStyle}">${escapeHtml(greeting)}</p>
          ${content.paragraphs.map(paragraph => `<p style="${paragraphStyle}">${escapeHtml(paragraph)}</p>`).join("\n")}
          ${details.length ? `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;margin-bottom:22px;"><tr><td bgcolor="#f8fafc" style="padding:18px 20px;border:1px solid #e2e8f0;">${details.map(detail => `<p style="margin:0 0 10px;color:#334155;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;word-wrap:break-word;overflow-wrap:anywhere;"><strong style="color:#0f172a;">${escapeHtml(detail.label)}:</strong> ${escapeHtml(detail.value)}</p>`).join("\n")}</td></tr></table>` : ""}
          ${
            action
              ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:6px 0 24px;"><tr><td bgcolor="#173e70" style="background-color:#173e70;text-align:center;"><a href="${escapeHtml(action.url)}" style="display:inline-block;border:14px solid #173e70;border-left-width:24px;border-right-width:24px;background-color:#173e70;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:bold;text-align:center;text-decoration:none;word-wrap:break-word;">${escapeHtml(action.label)}</a></td></tr></table>
          <p style="margin:0 0 8px;color:#475569;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">If the button does not work, copy and paste this link into your browser:</p>
          <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;word-break:break-all;overflow-wrap:anywhere;"><a href="${escapeHtml(action.url)}" style="color:#173e70;text-decoration:underline;word-break:break-all;">${escapeHtml(action.url)}</a></p>`
              : ""
          }
          <p style="margin:8px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;color:#475569;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;word-wrap:break-word;overflow-wrap:anywhere;">${escapeHtml(content.notice)}</p>
        </td></tr>
      </table>
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;"><tr><td align="center" style="padding:24px 12px;color:#475569;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;">
        <p style="margin:0 0 8px;">${supportUrl ? `<a href="${escapeHtml(supportUrl)}" style="color:#173e70;text-decoration:underline;">Visit our help page</a>` : escapeHtml(help)}</p>
        <p style="margin:0;">AuthCore &middot; Account and organization notifications</p>
      </td></tr></table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, html, text };
}
