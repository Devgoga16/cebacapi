module.exports = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    state: 'failed',
    data: null,
    message: err.message || 'Error interno del servidor',
    action_code: status
  });
};