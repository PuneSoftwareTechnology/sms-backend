import ApiError from '../utils/apiError.js';
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      console.log('[validate] ❌ Validation failed:', JSON.stringify(result.error.issues, null, 2));
      console.log('[validate] req.body:', req.body);
      console.log('[validate] req.file:', req.file ? req.file.originalname : 'NO FILE');
      console.log('[validate] Content-Type:', req.headers['content-type']);
      return next(new ApiError(400, result.error.issues[0].message));
    }

    req.validated = result.data;
    return next();
  };
}

export default validate;