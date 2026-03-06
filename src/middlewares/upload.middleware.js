import multer from 'multer';
import ApiError from '../utils/apiError.js';

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const imageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new ApiError(400, 'Unsupported file type'));
      return;
    }
    cb(null, true);
  },
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!imageMimeTypes.has(file.mimetype)) {
      cb(new ApiError(400, 'Only JPEG, PNG and WebP images are allowed'));
      return;
    }
    cb(null, true);
  },
});

export { imageUpload };
export default upload;
