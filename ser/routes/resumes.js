const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const ResumeParser = require('../resume-parser/src');
const { db } = require('../firebase');
const { getCollection } = require('./firebaseHelper');

const formatDoc = (doc) => ({ _id: doc.id, ...doc.data() });

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
router.post('/bulk-upload', upload.single('zipFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No zip file uploaded' });
    }

    const zipPath = req.file.path;
    const extractDir = path.join(tempUploadsDir, `extract_${Date.now()}`);

    try {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractDir, true);

        const extractedFiles = fs.readdirSync(extractDir);
        let successCount = 0;
        let failedCount = 0;
        let errors = [];

        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];

        for (const fileName of extractedFiles) {
            const ext = path.extname(fileName).toLowerCase();
            const filePath = path.join(extractDir, fileName);
            const isDir = fs.lstatSync(filePath).isDirectory();

            if (isDir || !allowedTypes.includes(ext)) {
                continue; 
            }

            try {
                const permanentFileName = `${Date.now()}_${fileName}`;
                const permanentPath = path.join(permanentUploadsDir, permanentFileName);
                fs.copyFileSync(filePath, permanentPath);

                const resumeParser = new ResumeParser(permanentPath);
                const result = await resumeParser.parseToJSON();
                const parsedData = result.parts || {};

                const normalizeSkills = (skillsData) => {
                    if (Array.isArray(skillsData)) return skillsData.map(s => String(s).trim().toLowerCase());
                    if (typeof skillsData === 'string') return skillsData.split(/[\n,]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
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

                const newResume = {
                    name: parsedData.name || 'Unknown Candidate',
                    email: parsedData.email || null,
                    phone: parsedData.phone || null,
                    objective: parsedData.objective || parsedData.summary || null,
                    skills: normalizeSkills(parsedData.skills),
                    experience: normalizeExperience(parsedData.experience),
                    education: normalizeEducation(parsedData.education),
                    profiles: Array.isArray(parsedData.profiles) ? parsedData.profiles : [],
                    rawText: result.text || '',
                    fileUrl: `/resumes/files/${permanentFileName}`,
                    fileName: fileName,
                    status: 'Parsed',
                    uploadedAt: new Date().toISOString()
                };

                const systemCode = req.query.system || req.body.system || null;
                const resumesCol = getCollection(db, systemCode, 'resumes');
                await resumesCol.add(newResume);
                successCount++;

            } catch (err) {
                console.error(`Failed to parse/save file ${fileName}:`, err);
                failedCount++;
                errors.push({ file: fileName, error: err.message });
            }
        }

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
        try { fs.unlinkSync(zipPath); } catch (e) { }
        try { fs.rmSync(extractDir, { recursive: true, force: true }); } catch (e) { }

        console.error('Bulk Upload Zip Extraction Error:', err);
        return res.status(500).json({ success: false, error: 'Failed to process zip file.' });
    }
});

// @route   GET /api/resumes
router.get('/', async (req, res) => {
    try {
        const { search, skills, page = 1, limit = 20, system } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        const resumesCol = getCollection(db, system || null, 'resumes');
        let queryRef = resumesCol;
        
        // Very basic Firestore 'all skills' simulation
        // Firebase doesn't support $all natively. For simple array-contains, we can at least filter by the first skill in the DB if skills array is sent.
        let requestedSkills = [];
        if (skills) {
            requestedSkills = skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            if (requestedSkills.length > 0) {
                queryRef = queryRef.where('skills', 'array-contains', requestedSkills[0]);
            }
        }

        const snapshot = await queryRef.get();
        let resumes = snapshot.docs.map(formatDoc);

        // Sort in memory to avoid missing uploadedAt fields dropping documents
        resumes.sort((a, b) => {
            const dateA = new Date(a.uploadedAt || a.createdAt || a.updatedAt || 0).getTime();
            const dateB = new Date(b.uploadedAt || b.createdAt || b.updatedAt || 0).getTime();
            return dateB - dateA;
        });

        // Memory filtration for complex queries
        if (requestedSkills.length > 1) {
            resumes = resumes.filter(resume => {
                const rs = resume.skills || [];
                return requestedSkills.every(reqSkill => rs.includes(reqSkill));
            });
        }

        if (search) {
            const searchLower = search.toLowerCase();
            resumes = resumes.filter(r => 
                (r.name && r.name.toLowerCase().includes(searchLower)) ||
                (r.rawText && r.rawText.toLowerCase().includes(searchLower)) ||
                (r.objective && r.objective.toLowerCase().includes(searchLower))
            );
        }

        const total = resumes.length;
        const skip = (pageNum - 1) * limitNum;
        const paginated = resumes.slice(skip, skip + limitNum);

        res.status(200).json({
            success: true,
            count: paginated.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: paginated
        });

    } catch (err) {
        console.error('Fetch resumes error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch resumes.' });
    }
});

// @route   POST /api/resumes
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, objective, skills, experience, education, profiles, system: bodySystem } = req.body;
        const systemCode = req.query.system || bodySystem || null;
        const resumesCol = getCollection(db, systemCode, 'resumes');

        const newResume = {
            name: name || 'Manual Entry',
            email: email || null,
            phone: phone || null,
            objective: objective || null,
            skills: Array.isArray(skills) ? skills : [],
            experience: Array.isArray(experience) ? experience : [],
            education: Array.isArray(education) ? education : [],
            profiles: Array.isArray(profiles) ? profiles : [],
            status: 'Parsed',
            uploadedAt: new Date().toISOString()
        };

        const docRef = await resumesCol.add(newResume);
        const doc = await docRef.get();
        
        res.status(201).json({ success: true, data: formatDoc(doc) });
    } catch (err) {
        console.error('Create resume error:', err);
        res.status(500).json({ success: false, error: 'Failed to create resume.' });
    }
});

// @route   GET /api/resumes/:id
router.get('/:id', async (req, res) => {
    try {
        const systemCode = req.query.system || null;
        const resumesCol = getCollection(db, systemCode, 'resumes');
        const doc = await resumesCol.doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Resume not found' });
        }
        res.status(200).json({ success: true, data: formatDoc(doc) });
    } catch (err) {
        console.error('Fetch single resume error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch resume.' });
    }
});

// @route   PUT /api/resumes/:id
router.put('/:id', async (req, res) => {
    try {
        const systemCode = req.query.system || req.body.system || null;
        const resumesCol = getCollection(db, systemCode, 'resumes');
        const docRef = resumesCol.doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Resume not found' });
        }

        await docRef.update(req.body);
        const updated = await docRef.get();
        res.status(200).json({ success: true, data: formatDoc(updated) });
    } catch (err) {
        console.error('Update resume error:', err);
        res.status(500).json({ success: false, error: 'Failed to update resume.' });
    }
});

// @route   DELETE /api/resumes/:id
router.delete('/:id', async (req, res) => {
    try {
        const systemCode = req.query.system || null;
        const resumesCol = getCollection(db, systemCode, 'resumes');
        const docRef = resumesCol.doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Resume not found' });
        }

        const resumeData = doc.data();
        if (resumeData.fileUrl) {
            const fileName = path.basename(resumeData.fileUrl);
            const filePath = path.join(__dirname, '../uploads/resumes', fileName);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { }
            }
        }

        await docRef.delete();
        res.status(200).json({ success: true, message: 'Resume deleted successfully' });
    } catch (err) {
        console.error('Delete resume error:', err);
        res.status(500).json({ success: false, error: 'Failed to delete resume.' });
    }
});

module.exports = router;
