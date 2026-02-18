import qrService from '../services/qr.service.js';
import { ok  } from '../utils/apiResponse.js';
async function activateQr(req, res) {
  const qrId = Number(req.params.qrId);
  const data = await qrService.activateQr(qrId);
  return ok(res, data, 'QR activated');
}

export {
activateQr,
};

export default {
activateQr,
};
