import bcrypt from "bcryptjs";
import ApiError from "../utils/apiError.js";
import userRepository from "../repositories/user.repository.js";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function createAdmin(payload) {
  const existing = await userRepository.findByEmail(payload.email);
  if (existing) {
    throw new ApiError(409, "Email already exists");
  }

  const role = payload.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";
  const passwordHash = await bcrypt.hash(payload.password, 10);
  return userRepository.createUser({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    passwordHash,
    role,
    isActive: true,
    isApproved: true,
    isEmailVerified: true,
  });
}

async function deleteAdmin(id) {
  const deleted = await userRepository.deleteUserByRoles(id, ADMIN_ROLES);
  if (!deleted) {
    throw new ApiError(404, "Admin not found");
  }
  return deleted;
}

async function updateAdmin(id, payload) {
  if (payload.email) {
    const existing = await userRepository.findByEmail(payload.email);
    if (existing && existing.id !== id) {
      throw new ApiError(409, "Email already exists");
    }
  }

  const updated = await userRepository.updateUserByRoles(id, ADMIN_ROLES, {
    name: payload.name,
    email: payload.email,
    role: payload.role,
  });
  if (!updated) {
    throw new ApiError(404, "Admin not found");
  }
  return updated;
}

async function getAllAdmins(filters = {}) {
  return userRepository.listUsersByRoles(ADMIN_ROLES, filters);
}

export { createAdmin, deleteAdmin, updateAdmin, getAllAdmins };

export default { createAdmin, deleteAdmin, updateAdmin, getAllAdmins };
