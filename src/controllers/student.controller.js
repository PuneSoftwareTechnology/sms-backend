import studentService from '../services/student.service.js';
import { ok  } from '../utils/apiResponse.js';
async function signup(req, res) {
  const user = await studentService.signup(req.validated.body);
  return ok(res, user, 'Student registered successfully', 201);
}

async function updateMyProfile(req, res) {
  const profile = await studentService.updateProfile(req.user.id, req.validated.body);
  return ok(res, profile, 'Profile updated');
}

async function getMyProfile(req, res) {
  const profile = await studentService.getProfile(req.user.id, req.user);
  return ok(res, profile, 'Profile fetched');
}

async function getStudentProfile(req, res) {
  const userId = Number(req.params.userId);
  const profile = await studentService.getProfile(userId, req.user);
  return ok(res, profile, 'Profile fetched');
}

export {
signup,
  updateMyProfile,
  getMyProfile,
  getStudentProfile,
};

export default {
signup,
  updateMyProfile,
  getMyProfile,
  getStudentProfile,
};
