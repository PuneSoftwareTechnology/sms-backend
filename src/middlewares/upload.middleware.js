import multer from 'multer';
import ApiError from '../utils/apiError.js';

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

export default upload;
