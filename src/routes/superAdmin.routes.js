import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.middleware.js';
import qrController from '../controllers/qr.controller.js';
const router = express.Router();

router.use(authMiddleware, authorizeRoles('SUPER_ADMIN'));

router.patch('/qr/:qrId/activate', asyncHandler(qrController.activateQr));

export default router;