import sesService from '../utils/ses.service.js';
import templates from '../emails/templates.js';
import userRepository from '../repositories/user.repository.js';
import recruiterRepository from '../repositories/recruiter.repository.js';
import env from '../config/env.js';

async function sendPasswordResetEmail({ to, token, name }) {
  const userName = name || (await userRepository.findByEmail(to))?.name;
  const resetLink = `${env.frontendUrl}/reset-password?token=${token}`;
  const { subject, html } = templates.passwordResetTemplate({ name: userName, resetLink });
  await sesService.sendEmail({ to, subject, html });
}

async function sendCvDownloadNotification({ recruiterId, studentId }) {
  const [recruiter, student] = await Promise.all([
    recruiterRepository.findById(recruiterId),
    userRepository.findById(studentId),
  ]);
  if (!student?.email) return;

  const { subject, html } = templates.cvDownloadNotificationTemplate({
    recruiterName: recruiter?.company_name || recruiter?.name || 'A recruiter',
    studentName: student.name,
  });
  await sesService.sendEmail({ to: student.email, subject, html });
}

async function sendShortlistNotification({ recruiterId, studentId, course }) {
  const [recruiter, student] = await Promise.all([
    recruiterRepository.findById(recruiterId),
    userRepository.findById(studentId),
  ]);
  if (!student?.email) return;

  const { subject, html } = templates.shortlistNotificationTemplate({
    recruiterCompany: recruiter?.company_name || recruiter?.name || 'A company',
    studentName: student.name,
    course,
  });
  await sesService.sendEmail({ to: student.email, subject, html });
}

async function sendPaymentReceiptEmail({ to, amount, receiptUrl, name, receiptPdf, receiptHtml }) {
  const userName = name || (await userRepository.findByEmail(to))?.name;

  // Use the full receipt HTML as email body when provided, otherwise fall back to basic template
  const emailHtml = receiptHtml || templates.paymentReceiptTemplate({
    name: userName,
    amount,
    receiptUrl,
  }).html;
  const subject = 'Payment Confirmation';

  if (receiptPdf) {
    await sesService.sendEmailWithAttachment({
      to,
      subject,
      html: emailHtml,
      attachment: {
        content: receiptPdf,
        filename: `Payment_Receipt_${(userName || 'Student').replace(/\s+/g, '_')}.pdf`,
      },
    });
  } else {
    await sesService.sendEmail({ to, subject, html: emailHtml });
  }
}

async function sendCertificateEmail({ to, certificateUrl, name, certificatePdf }) {
  const userName = name || (await userRepository.findByEmail(to))?.name;
  const { subject, html } = templates.certificateTemplate({
    name: userName,
    certificateUrl,
  });

  if (certificatePdf) {
    await sesService.sendEmailWithAttachment({
      to,
      subject,
      html,
      attachment: {
        content: certificatePdf,
        filename: `Certificate_${(userName || 'Student').replace(/\s+/g, '_')}.pdf`,
      },
    });
  } else {
    await sesService.sendEmail({ to, subject, html });
  }
}

async function sendBulkCustomEmail({ recipients, subject, body }) {
  const results = { sent: 0, failed: 0 };
  const BATCH_SIZE = 5;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map((recipient) => {
        const { html } = templates.bulkEmailTemplate({
          subject,
          body,
          recipientName: recipient.name,
        });
        return sesService.sendEmail({ to: recipient.email, subject, html });
      }),
    );

    for (let j = 0; j < settled.length; j++) {
      if (settled[j].status === 'fulfilled') {
        results.sent++;
      } else {
        results.failed++;
        console.error(`[Email] Failed to send to ${batch[j].email}:`, settled[j].reason?.message);
      }
    }
  }

  return results;
}

export {
  sendPasswordResetEmail,
  sendCvDownloadNotification,
  sendShortlistNotification,
  sendPaymentReceiptEmail,
  sendCertificateEmail,
  sendBulkCustomEmail,
};

export default {
  sendPasswordResetEmail,
  sendCvDownloadNotification,
  sendShortlistNotification,
  sendPaymentReceiptEmail,
  sendCertificateEmail,
  sendBulkCustomEmail,
};
