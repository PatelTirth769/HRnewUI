import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

// Protect routes middleware
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin middleware
const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
});

// HOD middleware
const hod = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'hod') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a HOD');
  }
});

// Admin or HOD middleware
const adminOrHod = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'hod')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized, requires admin or HOD role');
  }
});

// Teacher middleware
const teacher = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a teacher');
  }
});

export { protect, admin, hod, adminOrHod, teacher };