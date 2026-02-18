const ok = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const fail = (res, message = 'Error', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

export {
ok, fail
};

export default {
ok, fail
};
