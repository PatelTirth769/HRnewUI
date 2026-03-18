import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import { sendApprovalRequestEmail } from '../utils/emailService.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, securityPin } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Validate security pin for admin and HOD roles
  if (role === 'admin' || role === 'hod') {
    if (!securityPin) {
      res.status(400);
      throw new Error('Security PIN is required for admin and HOD roles');
    }

    const correctPin = role === 'admin' 
      ? process.env.ADMIN_SECURITY_PIN 
      : process.env.HOD_SECURITY_PIN;

    if (securityPin !== correctPin) {
      res.status(401);
      throw new Error('Invalid security PIN');
    }
  }

  // Determine if user needs approval
  const needsApproval = role === 'teacher' || role === 'faculty';
  
  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    department: department || undefined,
    securityPin: (role === 'admin' || role === 'hod') ? securityPin : undefined,
    isApproved: !needsApproval, // Only teachers and faculty need approval
  });

  if (user) {
    // If user needs approval, send approval request email to admins and HODs
    if (needsApproval) {
      // Find all admins and HODs
      const approvers = await User.find({
        role: { $in: ['admin', 'hod'] },
        isApproved: true,
      });

      // Send approval request emails
      for (const approver of approvers) {
        await sendApprovalRequestEmail({
          approverEmail: approver.email,
          approverName: approver.name,
          approverRole: approver.role,
          requestorName: user.name,
          requestorEmail: user.email,
          requestorRole: user.role,
          requestorDepartment: user.department,
        });
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isApproved: user.isApproved,
        message: 'Registration successful. Your account is pending approval.',
      });
    } else {
      // For roles that don't need approval (admin, hod, student)
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isApproved: user.isApproved,
        token: generateToken(user._id),
      });
    }
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email }).select('+password');

  // Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    // Check if user is approved
    if (!user.isApproved) {
      res.status(401);
      throw new Error('Your account is pending approval. Please wait for admin confirmation.');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isApproved: user.isApproved,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isApproved: user.isApproved,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      isApproved: updatedUser.isApproved,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};