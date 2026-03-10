const mongoose = require('mongoose');
const fs = require('fs');
mongoose.connect('mongodb://127.0.0.1:27017/new_project').then(async () => {
    const Resume = require('./models/Resume');
    const docs = await Resume.find().sort({ _id: -1 }).limit(2);
    fs.writeFileSync('db-out.json', JSON.stringify(docs, null, 2), 'utf8');
    process.exit(0);
}).catch(console.error);
