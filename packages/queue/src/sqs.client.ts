import { SQSClient } from "@aws-sdk/client-sqs";
import { config } from "@authcore/config";

export const sqsClient = new SQSClient({
  region: config.aws.region,
});
