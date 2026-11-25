const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ApiError } = require('../middleware/errorHandler');
const { findUserByEmail, findUserById, createUser } = require('../models/userModel');
const { logAudit } = require('../utils/auditLogger');

/**
 * Helper: Sign JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * @desc    Register a new Student or Faculty account
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'STUDENT' } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email, and password are required.');
    }

    if (name.trim().length < 2) {
      throw new ApiError(400, 'Name must be at least 2 characters long.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new ApiError(400, 'Please provide a valid email address.');
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long.');
    }

    // 2. Restrict self-registration roles (prevent public ADMIN registration)
    const normalizedRole = role.toUpperCase();
    const allowedSelfRegisterRoles = ['STUDENT', 'FACULTY'];
    if (!allowedSelfRegisterRoles.includes(normalizedRole)) {
      throw new ApiError(403, 'Invalid role selected. Only STUDENT or FACULTY registration is allowed.');
    }

    // 3. Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(409, 'An account with this email address already exists.');
    }

    // 4. Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Insert into MySQL
    const userId = await createUser({
      name,
      email,
      passwordHash,
      role: normalizedRole,
    });

    const newUser = await findUserById(userId);
    const token = generateToken(newUser);

    await logAudit({
      userId: newUser.id,
      action: `USER_REGISTERED_${normalizedRole}`,
      entityType: 'USER',
      entityId: newUser.id,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required.');
    }

    // 1. Lookup user
    const user = await findUserByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    // 2. Check account status
    if (user.status !== 'ACTIVE') {
      throw new ApiError(403, 'Your account is suspended. Please contact the administrator.');
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    // 4. Generate JWT & strip password_hash before responding
    const token = generateToken(user);
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
    };

    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in user's profile
 * @route   GET /api/auth/profile
 * @access  Private (JWT required)
 */
const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
};