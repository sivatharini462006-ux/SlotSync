const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const { findUserById } = require('../models/userModel');

/**
 * Verifies Bearer JWT token and attaches authenticated user to req.user
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access denied. No authentication token provided.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'Access denied. Malformed authorization header.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired session token. Please log in again.');
    }

    // Fetch fresh user state from MySQL to respect role changes or account suspensions immediately
    const user = await findUserById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'User account no longer exists.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ApiError(403, 'Your account has been suspended. Contact the administrator.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Usage: authorizeRoles('ADMIN') or authorizeRoles('STUDENT', 'FACULTY')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};