import { EmailQueue } from "./email.queue.js";
import { QueueService } from "./queue.service.js";
import { config } from "@authcore/config";
export { sqsClient } from "./sqs.client.js";

const queueService = new QueueService();
export const emailQueue = new EmailQueue(queueService, config.aws.emailQueueUrl);
export { queueService, EmailQueue };
