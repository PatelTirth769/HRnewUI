const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  examSubjectId: {
    type: String,
    trim: true
  },
  examSubjectName: {
    type: String,
    trim: true
  },
  academicSubjectId: {
    type: String,
    trim: true
  },
  academicSubjectName: {
    type: String,
    trim: true
  },
  isMapped: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;