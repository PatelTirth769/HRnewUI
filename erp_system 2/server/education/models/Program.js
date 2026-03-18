const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  programId: {
    type: String,
    required: true,
    unique: true
  },
  programName: {
    type: String,
    required: true
  },
  branchName: {
    type: String,
    required: true
  },
  instituteId: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Program', programSchema);