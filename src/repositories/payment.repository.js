import pool from '../config/db.js';

async function createPayment(payload, client = pool) {
  const { rows } = await client.query(
    `
      INSERT INTO payments (enrollment_id, amount, installment_number, receipt_url, payment_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      payload.enrollmentId,
      payload.amount,
      payload.installmentNumber,
      payload.receiptUrl || null,
      payload.paymentDate || new Date().toISOString().slice(0, 10),
    ],
  );
  return rows[0];
}

async function sumPaidAmount(enrollmentId, client = pool) {
  const { rows } = await client.query(
    'SELECT COALESCE(SUM(amount), 0) AS paid_amount FROM payments WHERE enrollment_id = $1',
    [enrollmentId],
  );
  return Number(rows[0].paid_amount || 0);
}

async function findByEnrollmentId(enrollmentId, client = pool) {
  const { rows } = await client.query(
    `SELECT installment_number, amount, payment_date, receipt_url
     FROM payments
     WHERE enrollment_id = $1
     ORDER BY installment_number`,
    [enrollmentId],
  );
  return rows;
}

export { createPayment, sumPaidAmount, findByEnrollmentId };

export default { createPayment, sumPaidAmount, findByEnrollmentId };
