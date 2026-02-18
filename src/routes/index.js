import express from 'express';
import studentApprovalMiddleware from '../middlewares/studentApproval.middleware.js';
import publicRoutes from './public.routes.js';
import superAdminRoutes from './superAdmin.routes.js';
import adminRoutes from './admin.routes.js';
import recruiterRoutes from './recruiter.role.routes.js';
import studentRoutes from './student.role.routes.js';
const router = express.Router();

router.use('/public', publicRoutes);
router.use('/student', studentRoutes);
router.use(studentApprovalMiddleware);
router.use('/super-admin', superAdminRoutes);
router.use('/admin', adminRoutes);
router.use('/recruiter', recruiterRoutes);

export default router;