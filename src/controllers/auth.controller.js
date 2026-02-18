import authService from '../services/auth.service.js';
import { ok  } from '../utils/apiResponse.js';
async function login(req, res) {
  const { email, password } = req.validated.body;
  const result = await authService.login(email, password);
  return ok(res, result, 'Login successful');
}

export {
login,
};

export default {
login,
};
