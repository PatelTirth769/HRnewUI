const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  cityId: {
    type: String,
    required: true,
    unique: true
  },
  cityName: {
    type: String,
    required: true
  },
  districtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
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

module.exports = mongoose.model('City', citySchema);