const express = require('express');
const path = require('path');
const fs = require('fs');
const ResumeParser = require('./src');
const multer = require('multer');

const router = express.Router();

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX and TXT files are allowed'));
        }
    }
});

// Temp directory for processing files
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

router.post('/', upload.single('file'), async (req, res) => {
    let tempFilePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        // Save buffer to temp file for parsing
        const fileName = `resume_${Date.now()}${path.extname(req.file.originalname)}`;
        tempFilePath = path.join(tempDir, fileName);
        fs.writeFileSync(tempFilePath, req.file.buffer);

        // Parse the resume
        const resume = new ResumeParser(tempFilePath);
        const result = await resume.parseToJSON();

        // Clean up temp file
        try { fs.unlinkSync(tempFilePath); } catch (e) { /* ignore cleanup errors */ }

        // Return parsed data
        res.status(200).json({
            success: true,
            data: result.parts || {},
            fileName: req.file.originalname,
            fileSize: req.file.size
        });
    } catch (error) {
        // Clean up on error too
        if (tempFilePath) {
            try { fs.unlinkSync(tempFilePath); } catch (e) { /* ignore */ }
        }
        console.error('Error parsing resume:', error);
        res.status(500).json({ success: false, error: 'Failed to parse resume' });
    }
});

module.exports = router;
