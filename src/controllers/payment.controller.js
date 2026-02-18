import paymentService from '../services/payment.service.js';
import { ok  } from '../utils/apiResponse.js';
async function createPayment(req, res) {
  const data = await paymentService.addPayment(req.validated.body);
  return ok(res, data, 'Payment added', 201);
}

export {
createPayment,
};

export default {
createPayment,
};
