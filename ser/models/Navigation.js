const mongoose = require('mongoose');

const navItemSchema = new mongoose.Schema({
  label: String,
  path: String,
  adminOnly: { type: Boolean, default: false },
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  title: String,
  icon: String,
  items: [navItemSchema],
}, { _id: false });

const navigationSchema = new mongoose.Schema({
  moduleKey: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  adminOnly: { type: Boolean, default: false },
  sections: [sectionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Navigation', navigationSchema);
