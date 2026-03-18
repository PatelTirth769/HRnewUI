const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  facultyId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  qualifications: [{
    type: String
  }],
  experience: {
    type: Number,
    default: 0
  },
  specialization: [{
    type: String
  }],
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
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

const Faculty = mongoose.model('Faculty', facultySchema);

module.exports = Faculty;