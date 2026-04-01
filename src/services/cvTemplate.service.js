import cvTemplateRepository from '../repositories/cvTemplate.repository.js';
import s3Service from '../utils/s3.service.js';
import ApiError from '../utils/apiError.js';

async function listAll() {
  const templates = await cvTemplateRepository.findAll();
  return resolveTemplateUrls(templates);
}

async function listByCourses(courses) {
  const templates = await cvTemplateRepository.findByCourses(courses);
  return resolveTemplateUrls(templates);
}

async function upload(file, { title, course, experienceLevel }, uploadedBy) {
  if (!file) throw new ApiError(400, 'Template file is required');

  const key = `cv-templates/${course}/${Date.now()}_${file.originalname}`;
  await s3Service.uploadBuffer(file.buffer, key, file.mimetype);

  const template = await cvTemplateRepository.create({
    title,
    course,
    experienceLevel,
    fileUrl: key,
    originalFilename: file.originalname,
    uploadedBy,
  });

  return {
    ...template,
    download_url: await s3Service.getSignedDownloadUrl(key),
  };
}

async function remove(id) {
  const template = await cvTemplateRepository.findById(id);
  if (!template) throw new ApiError(404, 'Template not found');

  await s3Service.deleteObject(template.file_url);
  await cvTemplateRepository.deleteById(id);

  return template;
}

async function resolveTemplateUrls(templates) {
  return Promise.all(
    templates.map(async (t) => ({
      id: t.id,
      title: t.title,
      course: t.course,
      experienceLevel: t.experience_level,
      originalFilename: t.original_filename,
      downloadUrl: await s3Service.getSignedDownloadUrl(t.file_url),
      createdAt: t.created_at,
    })),
  );
}

export { listAll, listByCourses, upload, remove };
export default { listAll, listByCourses, upload, remove };
