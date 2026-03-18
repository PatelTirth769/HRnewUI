import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import { sendApprovalEmail, sendRejectionEmail } from '../utils/emailService.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.department = req.body.department || user.department;
    user.isApproved = req.body.isApproved !== undefined ? req.body.isApproved : user.isApproved;

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
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get pending approval requests
// @route   GET /api/users/approval-requests
// @access  Private/Admin/HOD
const getApprovalRequests = asyncHandler(async (req, res) => {
  const pendingUsers = await User.find({
    isApproved: false,
    role: { $in: ['teacher', 'faculty'] },
  }).select('-password');

  res.json(pendingUsers);
});

// @desc    Approve user
// @route   PUT /api/users/:id/approve
// @access  Private/Admin/HOD
const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.isApproved = true;
    user.approvedBy = req.user._id;

    const updatedUser = await user.save();

    // Send approval email
    await sendApprovalEmail({
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      approverName: req.user.name,
      approverRole: req.user.role,
    });

    res.json({
      message: 'User approved successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isApproved: updatedUser.isApproved,
      },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Reject user
// @route   PUT /api/users/:id/reject
// @access  Private/Admin/HOD
const rejectUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Delete the user instead of keeping rejected users
    await user.deleteOne();

    // Send rejection email with reason
    if (req.body.reason) {
      await sendRejectionEmail({
        email: user.email,
        name: user.name,
        role: user.role,
        rejectionReason: req.body.reason,
        rejectorName: req.user.name,
        rejectorRole: req.user.role,
      });
    }

    res.json({
      message: 'User rejected successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getApprovalRequests,
  approveUser,
  rejectUser,
};