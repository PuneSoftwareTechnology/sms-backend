import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authorizeRoles from '../middlewares/authorize.middleware.js';
import superAdminController from '../controllers/superAdmin.controller.js';
import qrController from '../controllers/qr.controller.js';
import { createAdminSchema, createQrSchema } from '../validators/superAdmin.validator.js';
import { uuidIdParamSchema, qrIdParamSchema } from '../validators/common.validator.js';

const router = express.Router();

router.use(authMiddleware, authorizeRoles('SUPER_ADMIN'));

router.post('/admins', validate(createAdminSchema), asyncHandler(superAdminController.createAdmin));
router.delete('/admins/:id', validate(uuidIdParamSchema), asyncHandler(superAdminController.deleteAdmin));

router.post('/qr', validate(createQrSchema), asyncHandler(qrController.createQr));
router.get('/qr', asyncHandler(qrController.listQr));
router.delete('/qr/:id', validate(uuidIdParamSchema), asyncHandler(qrController.deleteQr));
router.patch('/qr/:qrId/activate', validate(qrIdParamSchema), asyncHandler(qrController.activateQr));

export default router;
