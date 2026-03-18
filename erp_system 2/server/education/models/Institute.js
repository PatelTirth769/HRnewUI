const mongoose = require('mongoose');

const InstituteSchema = new mongoose.Schema({
  instituteId: {
    type: String,
    required: true,
    unique: true
  },
  instituteName: {
    type: String,
    required: true
  },
  instituteCertificationNumber: {
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

module.exports = mongoose.model('Institute', InstituteSchema);