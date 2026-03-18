import ApiError from '../utils/apiError.js';
import userRepository from '../repositories/user.repository.js';

const allowedRoutes = [
  { method: 'GET', pathPrefix: '/api/student/profile' },
  { method: 'PUT', pathPrefix: '/api/student/profile' },
  { method: 'GET', pathPrefix: '/api/student/payments' },
];

async function studentApprovalMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'STUDENT') {
    return next();
  }

  const exempted = allowedRoutes.some(
    (route) => route.method === req.method && req.originalUrl.startsWith(route.pathPrefix),
  );

  if (exempted) {
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
