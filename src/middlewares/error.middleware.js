import ApiError from '../utils/apiError.js';
function notFoundMiddleware(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  if (statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

export {
notFoundMiddleware,
  errorMiddleware,
};

export default {
notFoundMiddleware,
  errorMiddleware,
};
