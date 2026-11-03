import { config } from "@authcore/config";
import { logger } from "@authcore/logger";
import { Resend } from "resend";

const resend = new Resend(config.email.resendApiKey);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailOptions): Promise<void> {
  const { error } = await resend.emails.send({
    from: config.email.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    ...(params.text && {
      text: params.text,
    }),
  });

  if (error) {
    const providerError = new Error(`Resend failed to send email: ${error.message}`, {
      cause: error,
    });

    logger.error(
      {
        event: "email.send.failed",
        provider: "resend",
        err: error,
      },
      "Failed to send email",
    );

    throw providerError;
  }

  logger.info(
    { event: "email.send.success", provider: "resend" },
    "Resend successfully send the email",
  );
}
