import sesService from '../utils/ses.service.js';
import templates from '../emails/templates.js';
import userRepository from '../repositories/user.repository.js';
import recruiterRepository from '../repositories/recruiter.repository.js';
import env from '../config/env.js';

async function sendSignupVerificationEmail({ to, name, token }) {
  const verificationLink = `${env.frontendUrl}/verify-email?token=${token}`;
  const { subject, html } = templates.signupVerificationTemplate({ name, verificationLink });
  await sesService.sendEmail({ to, subject, html });
}

async function sendPasswordResetEmail({ to, token }) {
  const user = await userRepository.findByEmail(to);
  const resetLink = `${env.frontendUrl}/reset-password?token=${token}`;
  const { subject, html } = templates.passwordResetTemplate({ name: user?.name, resetLink });
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

async function sendPaymentReceiptEmail({ to, amount, receiptUrl }) {
  const user = await userRepository.findByEmail(to);
  const { subject, html } = templates.paymentReceiptTemplate({
    name: user?.name,
    amount,
    receiptUrl,
  });
  await sesService.sendEmail({ to, subject, html });
}

async function sendCertificateEmail({ to, certificateUrl }) {
  const user = await userRepository.findByEmail(to);
  const { subject, html } = templates.certificateTemplate({
    name: user?.name,
    certificateUrl,
  });
  await sesService.sendEmail({ to, subject, html });
}

async function sendBulkCustomEmail({ recipients, subject, body }) {
  const results = { sent: 0, failed: 0 };

  for (const recipient of recipients) {
    try {
      const { html } = templates.bulkEmailTemplate({
        subject,
        body,
        recipientName: recipient.name,
      });
      await sesService.sendEmail({ to: recipient.email, subject, html });
      results.sent++;
    } catch (err) {
      results.failed++;
      console.error(`[Email] Failed to send to ${recipient.email}:`, err.message);
    }
  }

  return results;
}

export {
  sendSignupVerificationEmail,
  sendPasswordResetEmail,
  sendCvDownloadNotification,
  sendShortlistNotification,
  sendPaymentReceiptEmail,
  sendCertificateEmail,
  sendBulkCustomEmail,
};

export default {
  sendSignupVerificationEmail,
  sendPasswordResetEmail,
  sendCvDownloadNotification,
  sendShortlistNotification,
  sendPaymentReceiptEmail,
  sendCertificateEmail,
  sendBulkCustomEmail,
};
