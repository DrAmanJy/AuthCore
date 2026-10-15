import { config } from "@authcore/config";
import { logger } from "@authcore/logger";

import { EmailConsumer } from "./email/email.consumer.js";
import { EmailService } from "./email/email.service.js";

const emailService = new EmailService();

const emailConsumer = new EmailConsumer(config.aws.emailQueueUrl, emailService);

async function start(): Promise<void> {
  await emailConsumer.start();
  logger.info(
    { event: "worker.startup.success", worker: "email" },
    "Email worker successfully started",
  );
}

start().catch((error: unknown) => {
  logger.fatal(
    {
      event: "worker.startup.failed",
      worker: "email",
      err: error,
    },
    "Email worker failed to start",
  );

  process.exit(1);
});
