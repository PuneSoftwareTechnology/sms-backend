import qrService from '../services/qr.service.js';
import { ok } from '../utils/apiResponse.js';

async function createQr(req, res) {
  const data = await qrService.createQr(req.validated.body);
  return ok(res, data, 'QR created', 201);
}

async function listQr(req, res) {
  const data = await qrService.listQr();
  return ok(res, data, 'QR list fetched');
}

async function deleteQr(req, res) {
  const data = await qrService.deleteQr(req.params.id);
  return ok(res, data, 'QR deleted');
}

async function activateQr(req, res) {
  const data = await qrService.activateQr(req.params.qrId);
  return ok(res, data, 'QR activated');
}

export { createQr, listQr, deleteQr, activateQr };

export default { createQr, listQr, deleteQr, activateQr };
