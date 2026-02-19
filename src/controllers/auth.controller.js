import authService from '../services/auth.service.js';
import { ok } from '../utils/apiResponse.js';

async function login(req, res) {
  const { email, password } = req.validated.body;
  const result = await authService.login(email, password);
  return ok(res, result, 'Login successful');
}

async function verifyEmail(req, res) {
  const result = await authService.verifyEmail(req.validated.body.token);
  return ok(res, result, 'Email verified');
}

async function forgotPassword(req, res) {
  const result = await authService.forgotPassword(req.validated.body.email);
  return ok(res, result, 'Password reset email sent if account exists');
}

async function resetPassword(req, res) {
  const { token, password } = req.validated.body;
  const result = await authService.resetPassword(token, password);
  return ok(res, result, 'Password reset successful');
}

async function logout(req, res) {
  const result = await authService.logout(req.token || '');
  return ok(res, result, 'Logout successful');
}

export { login, verifyEmail, forgotPassword, resetPassword, logout };

export default { login, verifyEmail, forgotPassword, resetPassword, logout };
