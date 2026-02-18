import env from '../config/env.js';
async function sendSignupVerificationEmail({ to, name, token }) {
  if (!env.sesFromEmail) {
    return;
  }

  // Placeholder SES integration point.
  // Implement AWS SES send API call in production.
  void to;
  void name;
  void token;
}

async function sendPaymentReceiptEmail({ to, amount, receiptUrl }) {
  if (!env.sesFromEmail) {
    return;
  }

  void to;
  void amount;
  void receiptUrl;
}

async function sendCvDownloadNotification({ recruiterId, studentId }) {
  if (!env.sesFromEmail) {
    return;
  }

  void recruiterId;
  void studentId;
}

async function sendShortlistNotification({ recruiterId, studentId, course }) {
  if (!env.sesFromEmail) {
    return;
  }

  void recruiterId;
  void studentId;
  void course;
}

export {
sendSignupVerificationEmail,
  sendPaymentReceiptEmail,
  sendCvDownloadNotification,
  sendShortlistNotification,
};

export default {
sendSignupVerificationEmail,
  sendPaymentReceiptEmail,
  sendCvDownloadNotification,
  sendShortlistNotification,
};
