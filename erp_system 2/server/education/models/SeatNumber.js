const mongoose = require('mongoose');

const seatNumberSchema = new mongoose.Schema({
  instituteId: {
    type: String,
    required: true,
    trim: true
  },
  yearId: {
    type: String,
    required: true,
    trim: true
  },
  examFacultyId: {
    type: String,
    required: true,
    trim: true
  },
  examBlockNo: {
    type: String,
    required: true,
    trim: true
  },
  examRoomNo: {
    type: String,
    required: true,
    trim: true
  },
  examSeatNo: {
    type: String,
    required: true,
    trim: true
  },
  studentId: {
    type: String,
    required: true,
    trim: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  enrollmentNo: {
    type: String,
    required: true,
    trim: true
  },
  programId: {
    type: String,
    required: true,
    trim: true
  },
  programName: {
    type: String,
    required: true,
    trim: true
  },
  qrCode: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Pre-find hook to exclude soft-deleted records
seatNumberSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('SeatNumber', seatNumberSchema);