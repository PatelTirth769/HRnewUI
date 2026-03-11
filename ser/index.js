const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
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

const PORT = process.env.PORT || 5000;

// MongoDB Connection Logic (Mirrors main server config)
const uriEnv = process.env.MONGO_URI || '';
const isPlaceholder = uriEnv.includes('<') || uriEnv.includes('>');
const primaryUri = isPlaceholder ? '' : uriEnv;
const fallbackUri = process.env.MONGO_URI_LOCAL || 'mongodb://127.0.0.1:27017/new_project';
const uriToUse = primaryUri || fallbackUri;

mongoose.connect(uriToUse)
    .then(() => {
        console.log(`MongoDB Connected: ${uriToUse.includes('127.0.0.1') ? 'local' : 'remote cluster'}`);
        app.listen(PORT, () => console.log(`Resume Parser Server started on port ${PORT}`));
    })
    .catch(async err => {
        console.error('Mongo connection error:', err && err.message);
        if (primaryUri && !primaryUri.includes('127.0.0.1')) {
            try {
                await mongoose.connect(fallbackUri);
                console.log('MongoDB Connected: local fallback');
                app.listen(PORT, () => console.log(`Resume Parser Server started on port ${PORT}`));
            } catch (err2) {
                console.error('Mongo local fallback error:', err2 && err2.message);
                process.exit(1);
            }
        } else {
            process.exit(1);
        }
    });
