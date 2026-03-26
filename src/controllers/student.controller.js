import studentService from '../services/student.service.js';
import { ok } from '../utils/apiResponse.js';

async function signup(req, res) {
  const user = await studentService.signup(req.validated.body);
  return ok(res, user, 'Student registered successfully', 201);
}

async function updateMyProfile(req, res) {
  const profile = await studentService.updateProfile(req.user.id, req.validated.body);
  return ok(res, profile, 'Profile updated');
}

async function getMyProfile(req, res) {
  const profile = await studentService.getMyFullProfile(req.user.id);
  return ok(res, profile, 'Profile fetched');
}

async function getStudentProfile(req, res) {
  const profile = await studentService.getMyFullProfile(req.params.userId);
  return ok(res, profile, 'Profile fetched');
}

async function approveStudent(req, res) {
  const student = await studentService.approveStudent(req.params.id);
  return ok(res, student, 'Student approved');
}

async function uploadProfilePhoto(req, res) {
  const profile = await studentService.uploadProfilePhoto(req.user.id, req.file);
  return ok(res, profile, 'Profile photo updated');
}

async function uploadProject(req, res) {
  const submission = await studentService.uploadProject(req.user.id, req.file);
  return ok(res, submission, 'Project uploaded', 201);
}

async function uploadCv(req, res) {
  const cv = await studentService.uploadCv(req.user.id, req.file);
  return ok(res, cv, 'CV uploaded', 201);
}

async function uploadCertificate(req, res) {
  const result = await studentService.uploadCertificate(req.user.id, req.file);
  return ok(res, result, 'Certificate uploaded', 201);
}

export {
  signup,
  updateMyProfile,
  getMyProfile,
  getStudentProfile,
  approveStudent,
  uploadProfilePhoto,
  uploadProject,
  uploadCv,
  uploadCertificate,
};

export default {
  signup,
  updateMyProfile,
  getMyProfile,
  getStudentProfile,
  approveStudent,
  uploadProfilePhoto,
  uploadProject,
  uploadCv,
  uploadCertificate,
};
