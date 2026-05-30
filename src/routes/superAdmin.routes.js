import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import validate from "../middlewares/validate.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/authorize.middleware.js";
import { imageUpload } from "../middlewares/upload.middleware.js";
import superAdminController from "../controllers/superAdmin.controller.js";
import qrController from "../controllers/qr.controller.js";
import courseController from "../controllers/course.controller.js";
import {
  createAdminSchema,
  updateAdminSchema,
  createQrSchema,
} from "../validators/superAdmin.validator.js";
import {
  createCourseSchema,
  updateCourseSchema,
} from "../validators/course.validator.js";
import {
  uuidIdParamSchema,
  qrIdParamSchema,
} from "../validators/common.validator.js";

const router = express.Router();

router.use(authMiddleware, authorizeRoles("SUPER_ADMIN"));

router.post(
  "/admins",
  validate(createAdminSchema),
  asyncHandler(superAdminController.createAdmin),
);
router.get("/admins", asyncHandler(superAdminController.getAllAdmins));
router.put(
  "/admins/:id",
  validate(updateAdminSchema),
  asyncHandler(superAdminController.updateAdmin),
);
router.delete(
  "/admins/:id",
  validate(uuidIdParamSchema),
  asyncHandler(superAdminController.deleteAdmin),
);

router.post(
  "/qr",
  imageUpload.single("image"),
  validate(createQrSchema),
  asyncHandler(qrController.createQr),
);
router.get("/qr", asyncHandler(qrController.listQr));
router.delete(
  "/qr/:id",
  validate(uuidIdParamSchema),
  asyncHandler(qrController.deleteQr),
);
router.patch(
  "/qr/:qrId/activate",
  validate(qrIdParamSchema),
  asyncHandler(qrController.activateQr),
);

router.get("/courses", asyncHandler(courseController.listCourses));
router.post(
  "/courses",
  validate(createCourseSchema),
  asyncHandler(courseController.createCourse),
);
router.put(
  "/courses/:id",
  validate(updateCourseSchema),
  asyncHandler(courseController.updateCourse),
);
router.delete(
  "/courses/:id",
  validate(uuidIdParamSchema),
  asyncHandler(courseController.deleteCourse),
);

export default router;
