import cvTemplateService from '../services/cvTemplate.service.js';
import { ok } from '../utils/apiResponse.js';

async function listTemplates(_req, res) {
  const templates = await cvTemplateService.listAll();
  return ok(res, templates, 'Templates fetched');
}

async function uploadTemplate(req, res) {
  const { title, course, experienceLevel } = req.body;
  const template = await cvTemplateService.upload(req.file, { title, course, experienceLevel }, req.user.id);
  return ok(res, template, 'Template uploaded', 201);
}

async function deleteTemplate(req, res) {
  await cvTemplateService.remove(req.params.id);
  return ok(res, null, 'Template deleted');
}

export { listTemplates, uploadTemplate, deleteTemplate };
export default { listTemplates, uploadTemplate, deleteTemplate };
