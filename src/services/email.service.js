// Centralized email service abstraction.
// Plug AWS SES implementation here.

async function sendSignupVerificationEmail({ to, name, token }) {
  void to;
  void name;
  void token;
}

async function sendPasswordResetEmail({ to, token }) {
  void to;
  void token;
}

async function sendCvDownloadNotification({ recruiterId, studentId }) {
  void recruiterId;
  void studentId;
}

async function sendShortlistNotification({ recruiterId, studentId, course }) {
  void recruiterId;
  void studentId;
  void course;
}

async function sendPaymentReceiptEmail({ to, amount, receiptUrl }) {
  void to;
  void amount;
  void receiptUrl;
}

async function sendCertificateEmail({ to, certificateUrl }) {
  void to;
  void certificateUrl;
}

export {
  sendSignupVerificationEmail,
  sendPasswordResetEmail,
  sendCvDownloadNotification,
  sendShortlistNotification,
  sendPaymentReceiptEmail,
  sendCertificateEmail,
};

export default {
  sendSignupVerificationEmail,
  sendPasswordResetEmail,
  sendCvDownloadNotification,
  sendShortlistNotification,
  sendPaymentReceiptEmail,
  sendCertificateEmail,
};
