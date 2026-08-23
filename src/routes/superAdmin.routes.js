import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import validate from "../middlewares/validate.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/authorize.middleware.js";
import { imageUpload } from "../middlewares/upload.middleware.js";
import superAdminController from "../controllers/superAdmin.controller.js";
import qrController from "../controllers/qr.controller.js";
import courseController from "../controllers/course.controller.js";
import trainerController from "../controllers/trainer.controller.js";
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
  createTrainerSchema,
  updateTrainerSchema,
  mergeTrainersSchema,
} from "../validators/trainer.validator.js";
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

// ─── Trainers ──────────────────────────────────────────────────
// Only super admins create and edit trainers; everyone else selects from the
// list via GET /admin/trainers. Merge is here too — it repoints enrollments and
// payouts, so it is the most destructive action in the feature.
router.get("/trainers", asyncHandler(trainerController.listTrainersWithStats));
router.post(
  "/trainers",
  validate(createTrainerSchema),
  asyncHandler(trainerController.createTrainer),
);
router.post(
  "/trainers/merge",
  validate(mergeTrainersSchema),
  asyncHandler(trainerController.mergeTrainers),
);
router.patch(
  "/trainers/:id",
  validate(updateTrainerSchema),
  asyncHandler(trainerController.updateTrainer),
);
router.delete(
  "/trainers/:id",
  validate(uuidIdParamSchema),
  asyncHandler(trainerController.deleteTrainer),
);

export default router;
