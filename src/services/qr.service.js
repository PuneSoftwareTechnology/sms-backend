import pool from '../config/db.js';
import ApiError from '../utils/apiError.js';
import qrRepository from '../repositories/qr.repository.js';
async function activateQr(qrId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await qrRepository.deactivateAll(client);
    const activated = await qrRepository.activateById(qrId, client);

    if (!activated) {
      throw new ApiError(404, 'QR code not found');
    }

    await client.query('COMMIT');
    return activated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export {
activateQr,
};

export default {
activateQr,
};
