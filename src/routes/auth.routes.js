import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authController from '../controllers/auth.controller.js';
import { loginSchema  } from '../validators/auth.validator.js';
const router = express.Router();

router.post('/login', validate(loginSchema), asyncHandler(authController.login));

export default router;