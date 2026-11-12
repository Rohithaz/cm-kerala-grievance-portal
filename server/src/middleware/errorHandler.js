export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'The requested resource was not found.' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = Number(error.status) || 500;
  if (status >= 500) console.error('Request failed:', error.code || 'UNEXPECTED_SERVER_ERROR');
  res.status(status).json({
    success: false,
    message: status >= 500 ? 'An unexpected server error occurred.' : error.message,
  });
}