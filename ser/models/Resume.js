const mongoose = require('mongoose');

const ExperienceSchema = new mongoose.Schema({
    title: String,
    company: String,
    date: String,
    description: String
});

const EducationSchema = new mongoose.Schema({
    degree: String,
    school: String,
    date: String
});

const ProfileSchema = new mongoose.Schema({
    network: String,
    url: String
});

const ResumeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, index: true },
    phone: String,
    objective: String,
    skills: [String],
    experience: [ExperienceSchema],
    education: [EducationSchema],
    profiles: [ProfileSchema],
    rawText: String, // Store the full raw text for comprehensive searching
    fileUrl: String, // Path or URL to original PDF/Word doc
    fileName: String,
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'Parsed', enum: ['Parsed', 'Failed', 'Pending'] }
}, { timestamps: true });

// Indexes for fast searching based on the implementation plan
ResumeSchema.index({ 'skills': 1 }); // Index for exact skill matching
ResumeSchema.index({ 'experience.title': 1 });
ResumeSchema.index({ 'experience.company': 1 });

// Text index for general keyword searches across raw text, skills, and titles
ResumeSchema.index({
    name: 'text',
    skills: 'text',
    'experience.title': 'text',
    rawText: 'text'
});

module.exports = mongoose.model('Resume', ResumeSchema);
