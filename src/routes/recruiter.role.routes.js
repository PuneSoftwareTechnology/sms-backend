import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.middleware.js';
import recruiterController from '../controllers/recruiter.controller.js';
import studentController from '../controllers/student.controller.js';
import { shortlistSchema, downloadSchema, candidateFilterQuerySchema } from '../validators/recruiter.validator.js';
import { userIdParamSchema } from '../validators/common.validator.js';

const router = express.Router();

router.use(authMiddleware, authorizeRoles('RECRUITER'));

router.get('/candidates', validate(candidateFilterQuerySchema), asyncHandler(recruiterController.filterCandidates));
router.get('/download-count', asyncHandler(recruiterController.getDownloadCount));
router.post('/download-cv', validate(downloadSchema), asyncHandler(recruiterController.downloadCv));
router.post('/shortlist', validate(shortlistSchema), asyncHandler(recruiterController.shortlist));
router.get('/students/:userId/profile', validate(userIdParamSchema), asyncHandler(studentController.getStudentProfile));

export default router;
