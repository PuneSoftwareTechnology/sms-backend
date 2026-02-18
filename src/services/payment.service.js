import ApiError from '../utils/apiError.js';
import paymentRepository from '../repositories/payment.repository.js';
import enrollmentRepository from '../repositories/enrollment.repository.js';
import emailService from '../emails/email.service.js';
async function addPayment(payload) {
  const enrollment = await enrollmentRepository.findEnrollmentDetailsById(payload.enrollmentId);
  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  const payment = await paymentRepository.createPayment(payload);
  const paidAmount = await paymentRepository.sumPaidAmount(payload.enrollmentId);
  const pendingAmount = Number(enrollment.total_fee) - paidAmount;

  await emailService.sendPaymentReceiptEmail({
    to: enrollment.email,
    amount: payment.amount,
    receiptUrl: payment.receipt_url,
  });

  return {
    payment,
    summary: {
      totalFee: Number(enrollment.total_fee),
      paidAmount,
      pendingAmount,
    },
  };
}

export {
addPayment,
};

export default {
addPayment,
};
