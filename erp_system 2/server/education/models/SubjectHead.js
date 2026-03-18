const mongoose = require('mongoose');

const subjectHeadSchema = new mongoose.Schema({
  instituteId: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  programId: {
    type: String,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  leadFacultyName: {
    type: String,
    required: true
  },
  examiners: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const SubjectHead = mongoose.model('SubjectHead', subjectHeadSchema);

module.exports = SubjectHead;