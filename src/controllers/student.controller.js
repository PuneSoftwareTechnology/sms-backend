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
  const profile = await studentService.getProfile(req.user.id, req.user);
  return ok(res, profile, 'Profile fetched');
}

async function getStudentProfile(req, res) {
  const profile = await studentService.getProfile(req.params.userId, req.user);
  return ok(res, profile, 'Profile fetched');
}

async function approveStudent(req, res) {
  const student = await studentService.approveStudent(req.params.id);
  return ok(res, student, 'Student approved');
}

async function addCertification(req, res) {
  const certification = await studentService.addCertification(req.user.id, req.validated.body);
  return ok(res, certification, 'Certification added', 201);
}

async function deleteCertification(req, res) {
  const result = await studentService.removeCertification(req.user.id, req.params.id);
  return ok(res, result, 'Certification deleted');
}

async function uploadProject(req, res) {
  const submission = await studentService.uploadProject(req.user.id, req.file);
  return ok(res, submission, 'Project uploaded', 201);
}

async function uploadCv(req, res) {
  const cv = await studentService.uploadCv(req.user.id, req.file);
  return ok(res, cv, 'CV uploaded', 201);
}

export {
  signup,
  updateMyProfile,
  getMyProfile,
  getStudentProfile,
  approveStudent,
  addCertification,
  deleteCertification,
  uploadProject,
  uploadCv,
};

export default {
  signup,
  updateMyProfile,
  getMyProfile,
  getStudentProfile,
  approveStudent,
  addCertification,
  deleteCertification,
  uploadProject,
  uploadCv,
};
