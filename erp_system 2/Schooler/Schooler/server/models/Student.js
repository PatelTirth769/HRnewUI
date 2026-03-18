const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  enrollmentNo: {
    type: String,
    required: true,
    unique: true
  },
  contactNo: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Pre-find hook to exclude soft-deleted records
studentSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Student', studentSchema);