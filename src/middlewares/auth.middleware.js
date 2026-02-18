import ApiError from '../utils/apiError.js';
import { verifyToken  } from '../utils/jwt.js';
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };
    return next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

export default authMiddleware;