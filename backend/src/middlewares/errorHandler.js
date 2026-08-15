export const errorHandler = (err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    detail: err.message || 'Internal Server Error',
  });
};
