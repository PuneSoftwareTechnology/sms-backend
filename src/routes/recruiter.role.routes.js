import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.middleware.js';
import recruiterController from '../controllers/recruiter.controller.js';
import studentController from '../controllers/student.controller.js';
import { shortlistSchema, downloadSchema  } from '../validators/recruiter.validator.js';
const router = express.Router();

router.use(authMiddleware, authorizeRoles('RECRUITER'));

router.get('/candidates', asyncHandler(recruiterController.filterCandidates));
router.post('/download-cv', validate(downloadSchema), asyncHandler(recruiterController.downloadCv));
router.post('/shortlist', validate(shortlistSchema), asyncHandler(recruiterController.shortlist));
router.get('/students/:userId/profile', asyncHandler(studentController.getStudentProfile));

export default router;