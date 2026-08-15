import ApiError from "../utils/apiError.js";
import courseRepository from "../repositories/course.repository.js";

async function createCourse(payload, createdBy) {
  const name = (payload.name || "").trim();
  if (!name) {
    throw new ApiError(400, "Course name is required");
  }
  const type = payload.type || "ENQUIRY";
  const existing = await courseRepository.findCourseByName(name, type);
  if (existing) {
    throw new ApiError(409, "Course already exists");
  }
  return courseRepository.createCourse({
    name,
    type,
    isActive: payload.isActive,
    createdBy,
  });
}

async function listCourses(filters = {}) {
  return courseRepository.listCourses(filters);
}

async function updateCourse(id, payload) {
  const existing = await courseRepository.findCourseById(id);
  if (!existing) {
    throw new ApiError(404, "Course not found");
  }
  if (payload.name) {
    const name = payload.name.trim();
    // Uniqueness is per list, so compare within the course's own type.
    const dup = await courseRepository.findCourseByName(
      name,
      existing.course_type,
    );
    if (dup && dup.id !== id) {
      throw new ApiError(409, "Course name already in use");
    }
    payload.name = name;
  }
  return courseRepository.updateCourse(id, payload);
}

async function deleteCourse(id) {
  const deleted = await courseRepository.deleteCourse(id);
  if (!deleted) {
    throw new ApiError(404, "Course not found");
  }
  return deleted;
}

export { createCourse, listCourses, updateCourse, deleteCourse };

export default { createCourse, listCourses, updateCourse, deleteCourse };
