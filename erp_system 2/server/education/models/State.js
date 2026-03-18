const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
  stateId: {
    type: String,
    required: true,
    unique: true
  },
  stateName: {
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

module.exports = mongoose.model('State', stateSchema);