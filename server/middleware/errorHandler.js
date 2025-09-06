const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  // Log to console for dev
  console.error("Error Stack:", err.stack);
  console.error("Full Error Object:", err);

  // Multer errors (file upload middleware) - provide clearer client-facing messages
  // Multer sets err.name === 'MulterError' and err.code values like 'LIMIT_FILE_SIZE' or 'LIMIT_UNEXPECTED_FILE'
  if (err && (err.name === 'MulterError' || typeof err.code === 'string' && err.code.startsWith('LIMIT_'))) {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') message = 'Uploaded file is too large';
    else if (err.code === 'LIMIT_UNEXPECTED_FILE') message = `Unexpected file field: ${err.field || 'unknown'}`;
    else message = err.message || String(err);
    error = { statusCode: 400, message };
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`;
    error = { statusCode: 404, message }; // Simplified error object for consistency
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value entered: ${field}`;
    error = { statusCode: 400, message };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = { statusCode: 400, message };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
};

module.exports = errorHandler;
