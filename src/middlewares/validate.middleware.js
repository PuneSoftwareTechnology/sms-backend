import ApiError from '../utils/apiError.js';
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(new ApiError(400, result.error.issues[0].message));
    }

    req.validated = result.data;
    return next();
  };
}

export default validate;