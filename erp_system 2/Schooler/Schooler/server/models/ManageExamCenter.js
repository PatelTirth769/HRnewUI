const mongoose = require('mongoose');

const ManageExamCenterSchema = new mongoose.Schema({
  examCenterId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  examCenterName: {
    type: String,
    required: true,
    trim: true
  },
  examCenterAddress1: {
    type: String,
    required: true,
    trim: true
  },
  examCenterAddress2: {
    type: String,
    trim: true
  },
  cityId: {
    type: String,
    required: true,
    trim: true
  },
  stateId: {
    type: String,
    required: true,
    trim: true
  },
  pin: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  examParentInstituteId: {
    type: String,
    required: true,
    trim: true
  },
  examParentInstituteName: {
    type: String,
    required: true,
    trim: true
  },
  instituteId: {
    type: String,
    required: true,
    trim: true
  },
  pastExamCenterId: {
    type: String,
    trim: true
  },
  pastExamCenterName: {
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

module.exports = mongoose.model('ManageExamCenter', ManageExamCenterSchema);