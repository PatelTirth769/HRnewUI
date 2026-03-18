const express = require('express');
const router = express.Router();
const seatNumberController = require('../controllers/seatNumberController');

// Create a new seat number
router.post('/', seatNumberController.createSeatNumber);

// Upload Excel file
router.post('/upload', seatNumberController.uploadExcelFile);

// Get all seat numbers
router.get('/', seatNumberController.getAllSeatNumbers);

// Get seat numbers by filters
router.get('/filter', seatNumberController.getSeatNumbersByFilters);

// Get a single seat number
router.get('/:id', seatNumberController.getSeatNumber);

// Update a seat number
router.put('/:id', seatNumberController.updateSeatNumber);

// Delete a seat number
router.delete('/:id', seatNumberController.deleteSeatNumber);

module.exports = router;