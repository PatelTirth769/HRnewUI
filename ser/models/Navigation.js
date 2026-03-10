const mongoose = require('mongoose');

const NavItemSchema = new mongoose.Schema({
    label: { type: String, required: true },
    path: { type: String, required: true },
    adminOnly: { type: Boolean, default: false },
}, { _id: false });

const NavSectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    icon: { type: String, default: 'cog' },
    items: [NavItemSchema],
}, { _id: false });

const NavigationSchema = new mongoose.Schema({
    moduleKey: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    adminOnly: { type: Boolean, default: false },
    sections: [NavSectionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Navigation', NavigationSchema);
