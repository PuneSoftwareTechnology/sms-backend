import ApiError from '../utils/apiError.js';
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden'));
    }
    return next();
  };
}

export default authorizeRoles;