import courseService from "../services/course.service.js";
import { ok } from "../utils/apiResponse.js";

async function createCourse(req, res) {
  const row = await courseService.createCourse(
    req.validated.body,
    req.user?.id,
  );
  return ok(res, row, "Course created", 201);
}

async function listCourses(req, res) {
  const filters = {
    isActive:
      req.query.isActive === undefined
        ? undefined
        : req.query.isActive === "true",
    search: req.query.search || undefined,
    type: req.query.type || undefined,
  };
  const rows = await courseService.listCourses(filters);
  return ok(res, rows, "Courses fetched");
}

async function updateCourse(req, res) {
  const row = await courseService.updateCourse(
    req.params.id,
    req.validated.body,
  );
  return ok(res, row, "Course updated");
}

async function deleteCourse(req, res) {
  const row = await courseService.deleteCourse(req.params.id);
  return ok(res, row, "Course deleted");
}

export { createCourse, listCourses, updateCourse, deleteCourse };

export default { createCourse, listCourses, updateCourse, deleteCourse };
