import ApiError from '../utils/apiError.js';
import { verifyToken } from '../utils/jwt.js';
import authTokenRepository from '../repositories/authToken.repository.js';
import userRepository from '../repositories/user.repository.js';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  try {
    const blacklisted = await authTokenRepository.isTokenBlacklisted(token);
    if (blacklisted) {
      return next(new ApiError(401, 'Token is invalidated'));
    }

    const decoded = verifyToken(token);
    const user = await userRepository.findById(decoded.id);
    if (!user || !user.is_active) {
      return next(new ApiError(401, 'Account is inactive'));
    }

    req.user = { id: decoded.id, role: decoded.role };
    req.token = token;
    return next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

export default authMiddleware;
