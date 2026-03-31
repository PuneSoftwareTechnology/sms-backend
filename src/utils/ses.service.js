import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Agent } from 'node:https';
import env from '../config/env.js';

const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

function createSesClient() {
  const config = {
    region: env.awsRegion,
    // Reuse TCP connections across invocations in warm Lambda containers
    requestHandler: new NodeHttpHandler({
      httpsAgent: new Agent({ keepAlive: true }),
    }),
  };

  // On Lambda, credentials come from IAM role automatically.
  // Only use explicit keys for local development.
  if (!isLambda && env.awsAccessKeyId && env.awsSecretAccessKey) {
    config.credentials = {
      accessKeyId: env.awsAccessKeyId,
      secretAccessKey: env.awsSecretAccessKey,
    };
  }

  return new SESClient(config);
}

const ses = createSesClient();

async function sendEmail({ to, subject, html }) {
  if (!env.sesFromEmail) {
    console.warn('[SES] SES_FROM_EMAIL not configured, skipping email to:', to);
    return null;
  }

  const params = {
    Source: env.sesFromEmail,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: html, Charset: 'UTF-8' },
      },
    },
  };

  const result = await ses.send(new SendEmailCommand(params));
  return result.MessageId;
}

async function sendBulkEmail(recipients, subject, html) {
  const results = { sent: 0, failed: 0, errors: [] };

  for (const recipient of recipients) {
    try {
      await sendEmail({
        to: recipient.email || recipient,
        subject,
        html,
      });
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push({ email: recipient.email || recipient, error: err.message });
      console.error(`[SES] Failed to send email to ${recipient.email || recipient}:`, err.message);
    }
  }

  return results;
}

export { sendEmail, sendBulkEmail };

export default { sendEmail, sendBulkEmail };
