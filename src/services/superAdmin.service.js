import bcrypt from "bcrypt";
import ApiError from "../utils/apiError.js";
import userRepository from "../repositories/user.repository.js";

async function createAdmin(payload) {
  const existing = await userRepository.findByEmail(payload.email);
  if (existing) {
    throw new ApiError(409, "Email already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  return userRepository.createUser({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    passwordHash,
    role: "ADMIN",
    isActive: true,
    isApproved: true,
    isEmailVerified: true,
  });
}

async function deleteAdmin(id) {
  const deleted = await userRepository.deleteUserByRole(id, "ADMIN");
  if (!deleted) {
    throw new ApiError(404, "Admin not found");
  }
  return deleted;
}

async function getAllAdmins(filters = {}) {
  return userRepository.listUsersByRole("ADMIN", filters);
}

export { createAdmin, deleteAdmin, getAllAdmins };

export default { createAdmin, deleteAdmin, getAllAdmins };
