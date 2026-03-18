import pool from '../config/db.js';
import ApiError from '../utils/apiError.js';
import paymentRepository from '../repositories/payment.repository.js';
import enrollmentRepository from '../repositories/enrollment.repository.js';
import emailService from './email.service.js';

async function addPayment(payload) {
  const enrollment = await enrollmentRepository.findEnrollmentDetailsById(payload.enrollmentId);
  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  const payment = await paymentRepository.createPayment(payload);

  // Sync installment data back to enrollment table so student summary stays consistent
  const num = payload.installmentNumber;
  if (num >= 1 && num <= 3) {
    await pool.query(
      `UPDATE enrollments
       SET installment${num}_amount = $1,
           installment${num}_date   = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [payment.amount, payment.payment_date, payload.enrollmentId],
    );
  }

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

export { addPayment };

export default { addPayment };
