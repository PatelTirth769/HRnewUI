import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getApprovalRequests,
  approveUser,
  rejectUser,
} from '../controllers/userController.js';
import { protect, admin, adminOrHod } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all users and approval requests
router.route('/').get(protect, admin, getUsers);
router.route('/approval-requests').get(protect, adminOrHod, getApprovalRequests);

// User operations by ID
router
  .route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

// Approve or reject user
router.route('/:id/approve').put(protect, adminOrHod, approveUser);
router.route('/:id/reject').put(protect, adminOrHod, rejectUser);

export default router;