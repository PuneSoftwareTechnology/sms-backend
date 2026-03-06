import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.middleware.js';
import studentApprovalMiddleware from '../middlewares/studentApproval.middleware.js';
import upload, { imageUpload } from '../middlewares/upload.middleware.js';
import studentController from '../controllers/student.controller.js';
import testController from '../controllers/test.controller.js';
import { updateProfileSchema, signupSchema } from '../validators/student.validator.js';
import { submitTestSchema } from '../validators/test.validator.js';

const router = express.Router();

router.post('/signup', validate(signupSchema), asyncHandler(studentController.signup));

router.use(authMiddleware, authorizeRoles('STUDENT'));

router.get('/profile', asyncHandler(studentController.getMyProfile));
router.put('/profile', validate(updateProfileSchema), asyncHandler(studentController.updateMyProfile));
router.post('/profile/photo', imageUpload.single('photo'), asyncHandler(studentController.uploadProfilePhoto));

router.use(studentApprovalMiddleware);

router.post('/tests/submit', validate(submitTestSchema), asyncHandler(testController.submitTest));
router.post('/project-upload', upload.single('file'), asyncHandler(studentController.uploadProject));
router.post('/cv-upload', upload.single('file'), asyncHandler(studentController.uploadCv));
router.post('/certificate-upload', upload.single('file'), asyncHandler(studentController.uploadCertificate));

export default router;
