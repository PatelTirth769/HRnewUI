const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  districtId: {
    type: String,
    required: true,
    unique: true
  },
  districtName: {
    type: String,
    required: true
  },
  stateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
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

module.exports = mongoose.model('District', districtSchema);