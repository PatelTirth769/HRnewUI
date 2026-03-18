const mongoose = require('mongoose');

const degreeSchema = new mongoose.Schema({
  degreeId: {
    type: String,
    required: true,
    unique: true
  },
  degreeName: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    default: ''
  },
  parentDegree: {
    type: String,
    default: ''
  },
  instituteId: {
    type: String,
    required: true
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
degreeSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Degree', degreeSchema);