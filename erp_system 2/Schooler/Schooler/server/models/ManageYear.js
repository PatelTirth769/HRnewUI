const mongoose = require("mongoose");

const ManageYearSchema = new mongoose.Schema({
  yearId: { type: String, required: true, unique: true },
  year: { type: String, required: true },
  instituteId: { type: String, required: true },
  academy: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  finalYear: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ManageYear", ManageYearSchema);