import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.middleware.js';
import recruiterController from '../controllers/recruiter.controller.js';
import studentController from '../controllers/student.controller.js';
import { studentIdParamSchema, shortlistParamSchema, candidateFilterQuerySchema, bulkShortlistSchema, bulkRemoveShortlistSchema } from '../validators/recruiter.validator.js';
import { userIdParamSchema } from '../validators/common.validator.js';

const router = express.Router();

router.use(authMiddleware, authorizeRoles('RECRUITER'));

router.get('/candidates', validate(candidateFilterQuerySchema), asyncHandler(recruiterController.filterCandidates));
router.get('/download-count', asyncHandler(recruiterController.getDownloadCount));
router.get('/shortlist', asyncHandler(recruiterController.getShortlist));
router.get('/candidates/:studentId/cv', validate(studentIdParamSchema), asyncHandler(recruiterController.downloadCvByParam));
router.post('/candidates/bulk-shortlist', validate(bulkShortlistSchema), asyncHandler(recruiterController.bulkShortlist));
router.post('/candidates/:studentId/shortlist', validate(shortlistParamSchema), asyncHandler(recruiterController.shortlistByParam));
router.post('/candidates/bulk-remove-shortlist', validate(bulkRemoveShortlistSchema), asyncHandler(recruiterController.bulkRemoveShortlist));
router.delete('/candidates/:studentId/shortlist', validate(studentIdParamSchema), asyncHandler(recruiterController.removeShortlist));
router.get('/students/:userId/profile', validate(userIdParamSchema), asyncHandler(studentController.getStudentProfile));

export default router;
