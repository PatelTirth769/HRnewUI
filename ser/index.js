const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const System = require('./models/System');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => res.send('Resume Parser Server Running'));

// Configure temp directory for extracting zips
const tempUploadsDir = path.join(__dirname, 'temp_uploads');
const fs = require('fs');
if (!fs.existsSync(tempUploadsDir)) {
    fs.mkdirSync(tempUploadsDir, { recursive: true });
}

// Ensure the main uploads dir exists to store actual resumes permanently
const permanentUploadsDir = path.join(__dirname, 'uploads', 'resumes');
if (!fs.existsSync(permanentUploadsDir)) {
    fs.mkdirSync(permanentUploadsDir, { recursive: true });
}

// Serve the static uploaded resumes
app.use('/resumes/files', express.static(permanentUploadsDir));

// Resume parser route
app.use('/resume-parser', require('./resume-parser/index'));

// Navigation Routes (navbar tabs from DB)
app.use('/navigation', require('./routes/navigation'));

// Bulk Resume Routes
app.use('/api/resumes', require('./routes/resumes'));

// HR Dashboard Routes
app.use('/hr-dashboard', require('./routes/hrDashboard'));

// Recruitment Settings Routes
app.use('/recruitment-settings', require('./routes/recruitmentSettings'));

// Systems Routes (multi-system admin login)
app.use('/systems', require('./routes/systems'));

// ERP Proxy Routes (forwards requests to selected ERPNext instance)
app.use('/erp-proxy', require('./routes/erpProxy'));

const PORT = process.env.PORT || 3636;

function getDefaultSystems() {
    const preesheUrl = process.env.PREESHE_ERP_URL || 'https://preeshe.hrhovercraft.in';
    const lingayasUrl = process.env.LINGAYAS_ERP_URL || 'https://erpdev.lingayasvidyapeeth.edu.in:8000';
    // Keep Schooler configurable. If not provided, it falls back to Preeshe ERP URL.
    const schoolerUrl = process.env.SCHOOLER_ERP_URL || preesheUrl;

    return [
        {
            name: 'Preeshe',
            code: 'preeshe',
            erpNextUrl: preesheUrl,
            status: 'active',
            order: 1,
        },
        {
            name: 'Lingayas Vidyapeeth',
            code: 'lingayas',
            erpNextUrl: lingayasUrl,
            status: 'active',
            order: 2,
        },
        {
            name: 'Schooler',
            code: 'schooler',
            erpNextUrl: schoolerUrl,
            status: 'active',
            order: 3,
        },
    ];
}

async function bootstrapDefaultSystems() {
    const defaults = getDefaultSystems();

    for (const sys of defaults) {
        await System.updateOne(
            { code: sys.code },
            { $set: sys },
            { upsert: true }
        );
    }
}

// MongoDB Connection Logic (Atlas Exclusive)
const uriToUse = process.env.MONGO_URI;

if (!uriToUse) {
    console.error('MONGO_URI is not defined in .env file');
    process.exit(1);
}

mongoose.connect(uriToUse)
    .then(() => {
        console.log('MongoDB Connected: Atlas cluster');
        return bootstrapDefaultSystems();
    })
    .then(() => {
        console.log('Default systems synced (Preeshe, Lingayas Vidyapeeth, Schooler)');
        app.listen(PORT, () => console.log(`Resume Parser Server started on port ${PORT}`));
    })
    .catch(err => {
        console.error('Mongo connection error:', err && err.message);
        process.exit(1);
    });
