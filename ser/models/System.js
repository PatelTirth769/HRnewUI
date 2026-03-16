const mongoose = require('mongoose');

const systemSchema = new mongoose.Schema({
    name: { type: String, required: true },           // Display name e.g. "Preeshe"
    code: { type: String, required: true, unique: true }, // Unique code e.g. "preeshe"
    erpNextUrl: { type: String, required: true },      // ERPNext base URL e.g. "https://preeshe.hrhovercraft.in"
    status: { type: String, enum: ['active', 'upcoming'], default: 'active' },
    order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('System', systemSchema);
