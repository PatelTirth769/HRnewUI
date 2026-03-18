const mongoose = require('mongoose');

const examGroupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'YearConfiguration',
    required: true
  },
  specializations: [{
    type: String,
    trim: true
  }],
  courses: [{
    type: String,
    trim: true
  }],
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

const ExamGroup = mongoose.model('ExamGroup', examGroupSchema);

module.exports = ExamGroup;