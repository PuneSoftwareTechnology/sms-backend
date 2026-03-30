import pool from '../config/db.js';
import ApiError from '../utils/apiError.js';
import qrRepository from '../repositories/qr.repository.js';
import s3Service from '../utils/s3.service.js';

async function createQr(payload, file) {
  if (!file) {
    throw new ApiError(400, 'QR code image is required');
  }

  const key = `qr-codes/${Date.now()}_${file.originalname}`;
  await s3Service.uploadBuffer(file.buffer, key, file.mimetype);

  return qrRepository.createQr({ ...payload, imageUrl: key });
}

async function listQr() {
  const qrCodes = await qrRepository.listQr();
  return s3Service.resolvePresignedUrlsInArray(qrCodes, ['image_url']);
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
