import pool from '../config/db.js';
import ApiError from '../utils/apiError.js';
import qrRepository from '../repositories/qr.repository.js';

async function createQr(payload) {
  return qrRepository.createQr(payload);
}

async function listQr() {
  return qrRepository.listQr();
}

async function deleteQr(id) {
  const deleted = await qrRepository.deleteQr(id);
  if (!deleted) {
    throw new ApiError(404, 'QR code not found');
  }
  return deleted;
}

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

export { createQr, listQr, deleteQr, activateQr };

export default { createQr, listQr, deleteQr, activateQr };
