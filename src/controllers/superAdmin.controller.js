import superAdminService from "../services/superAdmin.service.js";
import { ok } from "../utils/apiResponse.js";

async function createAdmin(req, res) {
  const admin = await superAdminService.createAdmin(req.validated.body);
  return ok(res, admin, "Admin created", 201);
}

async function deleteAdmin(req, res) {
  const row = await superAdminService.deleteAdmin(req.params.id);
  return ok(res, row, "Admin deleted");
}

async function getAllAdmins(req, res) {
  const admins = await superAdminService.getAllAdmins();
  return ok(res, admins, "Admins fetched");
}

export { createAdmin, deleteAdmin, getAllAdmins };

export default { createAdmin, deleteAdmin, getAllAdmins };
