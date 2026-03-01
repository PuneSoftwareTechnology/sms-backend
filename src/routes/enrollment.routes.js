import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/authorize.middleware.js";
import enrollmentController from "../controllers/enrollment.controller.js";

const router = express.Router();

router.get(
  "/:enrollmentId",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  asyncHandler(enrollmentController.getEnrollmentById),
);

export default router;
