import pool from '../config/db.js';
async function createPayment(payload, client = pool) {
  const query = `
    INSERT INTO payments (enrollment_id, amount, installment_number, receipt_url)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [
    payload.enrollmentId,
    payload.amount,
    payload.installmentNumber,
    payload.receiptUrl || null,
  ];

  const { rows } = await client.query(query, values);
  return rows[0];
}

async function sumPaidAmount(enrollmentId, client = pool) {
  const query = `
    SELECT COALESCE(SUM(amount), 0) AS paid_amount
    FROM payments
    WHERE enrollment_id = $1
  `;
  const { rows } = await client.query(query, [enrollmentId]);
  return Number(rows[0].paid_amount || 0);
}

export {
createPayment,
  sumPaidAmount,
};

export default {
createPayment,
  sumPaidAmount,
};
