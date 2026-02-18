import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.middleware.js';
import recruiterController from '../controllers/recruiter.controller.js';
import { shortlistSchema, downloadSchema  } from '../validators/recruiter.validator.js';
const router = express.Router();

router.get(
  '/candidates',
  authMiddleware,
  authorizeRoles('RECRUITER', 'SUPER_ADMIN', 'ADMIN'),
  asyncHandler(recruiterController.filterCandidates),
);

router.post(
  '/download-cv',
  authMiddleware,
  authorizeRoles('RECRUITER'),
  validate(downloadSchema),
  asyncHandler(recruiterController.downloadCv),
);

router.post(
  '/shortlist',
  authMiddleware,
  authorizeRoles('RECRUITER'),
  validate(shortlistSchema),
  asyncHandler(recruiterController.shortlist),
);

export default router;