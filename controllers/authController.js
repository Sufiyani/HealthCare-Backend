import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import ApiResponse from '../utils/responses.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.badRequest(res, 'User already exists with this email');
    }

    // Create user
    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);

    ApiResponse.created(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    }, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return ApiResponse.badRequest(res, 'Please provide email and password');
    }

    // Check user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return ApiResponse.unauthorized(res, 'Invalid credentials');
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return ApiResponse.unauthorized(res, 'Invalid credentials');
    }

    const token = generateToken(user._id);

    ApiResponse.success(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    ApiResponse.success(res, {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    next(error);
  }
};
