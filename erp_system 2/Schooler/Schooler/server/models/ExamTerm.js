const mongoose = require('mongoose');

const examTermSchema = new mongoose.Schema({
  year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'YearConfiguration',
    required: true
  },
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  practical: {
    type: String,
    required: false
  },
  assignment: {
    type: String,
    required: false
  },
  examDate: {
    type: Date,
    required: true
  },
  gradingSystem: {
    type: String,
    required: true
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

const ExamTerm = mongoose.model('ExamTerm', examTermSchema);

module.exports = ExamTerm;