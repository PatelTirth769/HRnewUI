const mongoose = require('mongoose');

const reassessmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  examTerm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamTerm',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  originalMarks: {
    type: Number,
    required: true
  },
  reassessmentMarks: {
    type: Number,
    default: null
  },
  improvementMarks: {
    type: Number,
    default: null
  },
  nearestMarks: {
    type: Number,
    default: null
  },
  reassessmentType: {
    type: String,
    enum: ['reassessment', 'improvement', 'second_assessment'],
    required: true
  },
  facultyAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'completed', 'approved'],
    default: 'pending'
  },
  feesPaid: {
    type: Boolean,
    default: false
  },
  feesAmount: {
    type: Number,
    default: 0
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    default: null
  },
  remarks: {
    type: String,
    default: ''
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

const Reassessment = mongoose.model('Reassessment', reassessmentSchema);

module.exports = Reassessment;