const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema(
  {
    ecode: { type: String, index: true },
    name: String,
    company: String,
    department: String,
    eType: { type: String, enum: ['STAFF', 'WORKER'], default: 'STAFF' },
    gender: { type: String, enum: ['Male', 'Female', 'Transgender'], default: 'Male' },
    status: { type: String, enum: ['OnRoll', 'OffRoll', 'Left'], default: 'OnRoll' },
    workingFor: String,
    location: String,
    dob: Date,
    doj: Date,
    exitDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', EmployeeSchema);