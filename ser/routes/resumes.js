const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const ResumeParser = require('../resume-parser/src');
const Resume = require('../models/Resume');

// Paths
const tempUploadsDir = path.join(__dirname, '../temp_uploads');
const permanentUploadsDir = path.join(__dirname, '../uploads/resumes');

// Define Mutler Storage for Zip
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempUploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `bulk_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max for zip
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || path.extname(file.originalname).toLowerCase() === '.zip') {
            cb(null, true);
        } else {
            cb(new Error('Only ZIP files are allowed for bulk upload'));
        }
    }
});

// @route   POST /api/resumes/bulk-upload
// @desc    Upload a zip file containing resumes, extract, parse, save to DB
router.post('/bulk-upload', upload.single('zipFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No zip file uploaded' });
    }

    const zipPath = req.file.path;
    const extractDir = path.join(tempUploadsDir, `extract_${Date.now()}`);

    try {
        // Extract Zip
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractDir, true);

        const extractedFiles = fs.readdirSync(extractDir);
        let successCount = 0;
        let failedCount = 0;
        let errors = [];

        // Allowed document types for parser
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];

        // Process each extracted file
        for (const fileName of extractedFiles) {
            const ext = path.extname(fileName).toLowerCase();
            const filePath = path.join(extractDir, fileName);
            const isDir = fs.lstatSync(filePath).isDirectory();

            if (isDir || !allowedTypes.includes(ext)) {
                continue; // Skip folders and unsupported files
            }

            try {
                // 1. Move file to permanent storage
                const permanentFileName = `${Date.now()}_${fileName}`;
                const permanentPath = path.join(permanentUploadsDir, permanentFileName);
                fs.copyFileSync(filePath, permanentPath);

                // 2. Parse File using existing ResumeParser
                const resumeParser = new ResumeParser(permanentPath);
                const result = await resumeParser.parseToJSON();
                const parsedData = result.parts || {};

                // Normalize parser output which might be string or array
                const normalizeSkills = (skillsData) => {
                    if (Array.isArray(skillsData)) return skillsData.map(s => String(s).trim());
                    if (typeof skillsData === 'string') return skillsData.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                    return [];
                };

                const normalizeExperience = (expData) => {
                    if (Array.isArray(expData)) {
                        return expData.map(exp => ({
                            title: exp.title || 'Unknown Title',
                            company: exp.company || 'Unknown Company',
                            date: exp.date || '',
                            description: exp.description || ''
                        }));
                    }
                    if (typeof expData === 'string' && expData.trim()) {
                        return [{ title: 'Experience', company: 'Details in description', date: '', description: expData.trim() }];
                    }
                    return [];
                };

                const normalizeEducation = (eduData) => {
                    if (Array.isArray(eduData)) {
                        return eduData.map(edu => ({
                            degree: edu.degree || 'Degree',
                            school: edu.school || 'School',
                            date: edu.date || ''
                        }));
                    }
                    if (typeof eduData === 'string' && eduData.trim()) {
                        return [{ degree: 'Education', school: 'Details in description', date: '', description: eduData.trim() }];
                    }
                    return [];
                };

                // 3. Save to MongoDB
                const newResume = new Resume({
                    name: parsedData.name || 'Unknown Candidate',
                    email: parsedData.email,
                    phone: parsedData.phone,
                    objective: parsedData.objective || parsedData.summary,
                    skills: normalizeSkills(parsedData.skills),
                    experience: normalizeExperience(parsedData.experience),
                    education: normalizeEducation(parsedData.education),
                    profiles: Array.isArray(parsedData.profiles) ? parsedData.profiles : [],
                    rawText: result.text || '',
                    fileUrl: `/resumes/files/${permanentFileName}`,
                    fileName: fileName,
                    status: 'Parsed'
                });

                await newResume.save();
                successCount++;

            } catch (err) {
                console.error(`Failed to parse/save file ${fileName}:`, err);
                failedCount++;
                errors.push({ file: fileName, error: err.message });
            }
        }

        // Cleanup temp zip and extracted dir
        try { fs.unlinkSync(zipPath); } catch (e) { }
        try { fs.rmSync(extractDir, { recursive: true, force: true }); } catch (e) { }

        res.status(200).json({
            success: true,
            message: `Bulk processing complete.`,
            stats: {
                totalFilesFound: extractedFiles.length,
                success: successCount,
                failed: failedCount,
                errors
            }
        });

    } catch (err) {
        // Cleanup on primary failure
        try { fs.unlinkSync(zipPath); } catch (e) { }
        try { fs.rmSync(extractDir, { recursive: true, force: true }); } catch (e) { }

        console.error('Bulk Upload Zip Extraction Error:', err);
        return res.status(500).json({ success: false, error: 'Failed to process zip file.' });
    }
});

// @route   GET /api/resumes
// @desc    Get all resumes with optional filtering and text searching
router.get('/', async (req, res) => {
    try {
        const { search, skills, page = 1, limit = 20 } = req.query;
        let query = {};

        // Keyword Search (Raw Text, Name, Title, etc.)
        if (search) {
            query.$text = { $search: search };
        }

        // Specific Skills matching (Example: ?skills=React,Node.js)
        if (skills) {
            const skillsArray = skills.split(',').map(s => new RegExp(s.trim(), 'i'));
            query.skills = { $all: skillsArray }; // Requires ALL specified skills
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const resumes = await Resume.find(query)
            .sort({ uploadedAt: -1 }) // Newest first
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Resume.countDocuments(query);

        res.status(200).json({
            success: true,
            count: resumes.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: resumes
        });

    } catch (err) {
        console.error('Fetch resumes error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch resumes.' });
    }
});

// @route   POST /api/resumes
// @desc    Create a new resume manualmente
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, objective, skills, experience, education, profiles } = req.body;

        const resume = new Resume({
            name: name || 'Manual Entry',
            email,
            phone,
            objective,
            skills: Array.isArray(skills) ? skills : [],
            experience: Array.isArray(experience) ? experience : [],
            education: Array.isArray(education) ? education : [],
            profiles: Array.isArray(profiles) ? profiles : [],
            status: 'Parsed'
        });

        await resume.save();
        res.status(201).json({ success: true, data: resume });
    } catch (err) {
        console.error('Create resume error:', err);
        res.status(500).json({ success: false, error: 'Failed to create resume.' });
    }
});

// @route   GET /api/resumes/:id
// @desc    Get single resume
router.get('/:id', async (req, res) => {
    try {
        const resume = await Resume.findById(req.params.id);
        if (!resume) {
            return res.status(404).json({ success: false, error: 'Resume not found' });
        }
        res.status(200).json({ success: true, data: resume });
    } catch (err) {
        console.error('Fetch single resume error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch resume.' });
    }
});

// @route   PUT /api/resumes/:id
// @desc    Update a resume
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone, objective, skills, experience, education, profiles } = req.body;

        let resume = await Resume.findById(req.params.id);
        if (!resume) {
            return res.status(404).json({ success: false, error: 'Resume not found' });
        }

        if (name !== undefined) resume.name = name;
        if (email !== undefined) resume.email = email;
        if (phone !== undefined) resume.phone = phone;
        if (objective !== undefined) resume.objective = objective;
        if (Array.isArray(skills)) resume.skills = skills;
        if (Array.isArray(experience)) resume.experience = experience;
        if (Array.isArray(education)) resume.education = education;
        if (Array.isArray(profiles)) resume.profiles = profiles;

        await resume.save();
        res.status(200).json({ success: true, data: resume });
    } catch (err) {
        console.error('Update resume error:', err);
        res.status(500).json({ success: false, error: 'Failed to update resume.' });
    }
});

// @route   DELETE /api/resumes/:id
// @desc    Delete a resume
router.delete('/:id', async (req, res) => {
    try {
        const resume = await Resume.findById(req.params.id);
        if (!resume) {
            return res.status(404).json({ success: false, error: 'Resume not found' });
        }

        // Optional: Delete associated file
        if (resume.fileUrl) {
            // fileUrl is like /resumes/files/123_resume.docx
            // permanentUploadsDir is ser/uploads/resumes
            // So we need to map /resumes/files/ to ser/uploads/resumes
            const fileName = path.basename(resume.fileUrl);
            const filePath = path.join(__dirname, '../uploads/resumes', fileName);

            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error('Failed to delete file:', e);
                }
            }
        }

        await Resume.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Resume deleted successfully' });
    } catch (err) {
        console.error('Delete resume error:', err);
        res.status(500).json({ success: false, error: 'Failed to delete resume.' });
    }
});

module.exports = router;
