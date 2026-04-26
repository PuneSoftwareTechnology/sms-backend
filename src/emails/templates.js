function baseLayout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #1a56db; padding: 24px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; }
    .body { padding: 32px; color: #333333; line-height: 1.6; }
    .body h2 { color: #1a56db; margin-top: 0; font-size: 20px; }
    .body p { margin: 0 0 16px; font-size: 15px; }
    .btn { display: inline-block; padding: 12px 28px; background-color: #1a56db; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
    .btn:hover { background-color: #1e429f; }
    .info-box { background-color: #f0f4ff; border-left: 4px solid #1a56db; padding: 16px; margin: 16px 0; border-radius: 0 6px 6px 0; }
    .info-box p { margin: 0; }
    .footer { padding: 24px 32px; text-align: center; color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Training2Expert Management System</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from Training2Expert Management System.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

function passwordResetTemplate({ name, resetLink }) {
  return {
    subject: 'Reset Your Password',
    html: baseLayout(`
      <h2>Password Reset Request</h2>
      <p>Hi ${name || 'there'},</p>
      <p>We received a request to reset your password. Click the button below to set a new password.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${resetLink}" class="btn">Reset Password</a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280; font-size: 13px;">${resetLink}</p>
      <p>This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
    `),
  };
}

function paymentReceiptTemplate({ name, amount, receiptUrl }) {
  return {
    subject: 'Payment Confirmation',
    html: baseLayout(`
      <h2>Payment Received</h2>
      <p>Hi ${name || 'there'},</p>
      <p>We have successfully received your payment.</p>
      <div class="info-box">
        <p><strong>Amount Paid:</strong> &#8377;${Number(amount).toLocaleString('en-IN')}</p>
      </div>
      ${receiptUrl ? `<p style="text-align: center; margin: 24px 0;"><a href="${receiptUrl}" class="btn">View Receipt</a></p>` : ''}
      <p>If you have any questions about this payment, please contact the administration.</p>
    `),
  };
}

function cvDownloadNotificationTemplate({ recruiterName, studentName }) {
  return {
    subject: 'Your CV Was Downloaded by a Recruiter',
    html: baseLayout(`
      <h2>Great News!</h2>
      <p>Hi ${studentName},</p>
      <p>A recruiter has downloaded your CV. This means your profile is getting noticed!</p>
      <div class="info-box">
        <p><strong>Downloaded by:</strong> ${recruiterName}</p>
      </div>
      <p>Make sure your profile is up to date to maximize your chances.</p>
    `),
  };
}

function shortlistNotificationTemplate({ recruiterCompany, studentName, course }) {
  return {
    subject: 'You Have Been Shortlisted!',
    html: baseLayout(`
      <h2>Congratulations, ${studentName}!</h2>
      <p>You have been shortlisted by a recruiter. Keep up the great work!</p>
      <div class="info-box">
        <p><strong>Company:</strong> ${recruiterCompany}</p>
        <p><strong>Course:</strong> ${course}</p>
      </div>
      <p>The recruiter may reach out to you soon. Make sure your contact details are current.</p>
    `),
  };
}

function certificateTemplate({ name, certificateUrl }) {
  return {
    subject: 'Your Certificate is Ready',
    html: baseLayout(`
      <h2>Certificate Ready</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Your course certificate is now available for download.</p>
      ${certificateUrl ? `<p style="text-align: center; margin: 24px 0;"><a href="${certificateUrl}" class="btn">Download Certificate</a></p>` : ''}
      <p>Congratulations on completing your course!</p>
    `),
  };
}

function bulkEmailTemplate({ subject, body, recipientName }) {
  return {
    subject,
    html: baseLayout(`
      <h2>${subject}</h2>
      ${recipientName ? `<p>Hi ${recipientName},</p>` : ''}
      <div style="white-space: pre-wrap;">${body}</div>
    `),
  };
}

export {
  passwordResetTemplate,
  paymentReceiptTemplate,
  cvDownloadNotificationTemplate,
  shortlistNotificationTemplate,
  certificateTemplate,
  bulkEmailTemplate,
};

export default {
  passwordResetTemplate,
  paymentReceiptTemplate,
  cvDownloadNotificationTemplate,
  shortlistNotificationTemplate,
  certificateTemplate,
  bulkEmailTemplate,
};
