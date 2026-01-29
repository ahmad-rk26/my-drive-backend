// middlewares/error.middleware.js
export const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // In production, don't leak stack traces
    const response = {
        success: false,
        message,
    };

    if (process.env.NODE_ENV !== "production") {
        response.stack = err.stack;
        response.error = err;
    }

    res.status(statusCode).json(response);
};