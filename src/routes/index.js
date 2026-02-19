import express from 'express';
import publicRoutes from './public.routes.js';
import superAdminRoutes from './superAdmin.routes.js';
import adminRoutes from './admin.routes.js';
import recruiterRoutes from './recruiter.role.routes.js';
import studentRoutes from './student.role.routes.js';

const router = express.Router();

router.use('/public', publicRoutes);
router.use('/student', studentRoutes);
router.use('/recruiter', recruiterRoutes);
router.use('/admin', adminRoutes);
router.use('/super-admin', superAdminRoutes);

export default router;
