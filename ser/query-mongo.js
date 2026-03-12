const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
    console.error('MONGO_URI is not defined in .env file');
    process.exit(1);
}

mongoose.connect(mongoUri).then(async () => {
    const Resume = require('./models/Resume');
    const docs = await Resume.find().sort({ _id: -1 }).limit(2);
    fs.writeFileSync('db-out.json', JSON.stringify(docs, null, 2), 'utf8');
    process.exit(0);
}).catch(console.error);
