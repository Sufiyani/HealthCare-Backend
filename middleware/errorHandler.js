const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for debugging
  console.error("🔥 ERROR:", err);

  // Invalid Mongoose ObjectId
  if (err.name === 'CastError') {
    error = {
      message: 'Resource not found',
      statusCode: 404
    };
  }

  // Duplicate key error
  if (err.code === 11000) {
    error = {
      message: 'Duplicate field value entered',
      statusCode: 400
    };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = {
      message,
      statusCode: 400
    };
  }

  // Send response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
