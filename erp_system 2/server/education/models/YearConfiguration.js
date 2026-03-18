const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema({
  exam: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
});

const yearConfigurationSchema = new mongoose.Schema({
  academicYear: {
    type: String,
    required: true,
    unique: true
  },
  startOfSemester: {
    type: Date,
    required: true
  },
  endOfSemester: {
    type: Date,
    required: true
  },
  classCommenceDate: {
    type: Date,
    required: true
  },
  classEndDate: {
    type: Date,
    required: true
  },
  examSchedules: [examScheduleSchema],
  active: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Pre-find hook to exclude soft-deleted records
yearConfigurationSchema.pre('find', function() {
  this.where({ isDeleted: false });
});

yearConfigurationSchema.pre('findOne', function() {
  this.where({ isDeleted: false });
});

const YearConfiguration = mongoose.model('YearConfiguration', yearConfigurationSchema);

module.exports = YearConfiguration;