import ApiError from '../utils/apiError.js';
import userRepository from '../repositories/user.repository.js';
const allowedPrefixes = ['/api/students/profile'];

async function studentApprovalMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'STUDENT') {
    return next();
  }

  const isProfileRoute = allowedPrefixes.some((prefix) => req.originalUrl.startsWith(prefix));
  if (isProfileRoute) {
    return next();
  }

  const user = await userRepository.findById(req.user.id);
  if (!user) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  if (!user.is_approved) {
    return next(new ApiError(403, 'Your account is pending approval'));
  }

  return next();
}

export default studentApprovalMiddleware;