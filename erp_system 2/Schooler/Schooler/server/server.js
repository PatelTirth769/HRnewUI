const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const manageYearRoutes = require('./routes/manageYearRoutes');
const manageExamCenterRoutes = require('./routes/manageExamCenterRoutes');
const stateRoutes = require('./routes/stateRoutes');
const districtRoutes = require('./routes/districtRoutes');
const cityRoutes = require('./routes/cityRoutes');
const instituteRoutes = require('./routes/instituteRoutes');
const degreeRoutes = require('./routes/degreeRoutes');
const studentRoutes = require('./routes/studentRoutes');
const yearConfigurationRoutes = require('./routes/yearConfigurationRoutes');
const programRoutes = require('./routes/programRoutes');
const examTermRoutes = require('./routes/examTermRoutes');
const examGroupRoutes = require('./routes/examGroupRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const seatNumberRoutes = require('./routes/seatNumberRoutes');
const marksEntryChecklistRoutes = require('./routes/marksEntryChecklistRoutes');
const gracingCondonationRuleRoutes = require('./routes/gracingCondonationRule');
const reassessmentRoutes = require('./routes/reassessmentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const examDatesheetRoutes = require('./routes/examDatesheetRoutes');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make uploads directory static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB Atlas
async function connectToDatabase() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Atlas connected successfully');
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('\n❌ MongoDB Atlas connection error:', error.message);
    
    // Check for specific error types and provide helpful guidance
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n📋 Troubleshooting steps:');
      console.error('1. IP Whitelisting: Your IP address is not whitelisted in MongoDB Atlas.');
      console.error('   → Go to MongoDB Atlas Dashboard → Network Access');
      console.error('   → Click "Add IP Address" and add your current IP');
      console.error('   → Or temporarily allow access from anywhere (0.0.0.0/0) for testing');
      console.error('   → URL: https://cloud.mongodb.com/v2#/security/network/list');
      console.error('\n2. Connection String: Verify your MONGODB_URI in .env file is correct');
      console.error('3. Network: Check if your firewall or network is blocking the connection');
      console.error('4. Credentials: Ensure your database username and password are correct\n');
    } else if (error.message.includes('MONGODB_URI')) {
      console.error('\n📋 Solution:');
      console.error('   → Create a .env file in the server directory');
      console.error('   → Add: MONGODB_URI=your_mongodb_connection_string\n');
    }
    
    console.log('⚠️  Application will continue, but database operations may fail.');
    console.log('⚠️  Make sure to fix the connection before using database features.\n');
  }
}

// Connect to database
connectToDatabase();

// Routes
app.use('/api/manage-year', manageYearRoutes);
app.use('/api/manage-exam-center', manageExamCenterRoutes);
app.use('/api/states', stateRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/degrees', degreeRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/year-configurations', yearConfigurationRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/exam-terms', examTermRoutes);
app.use('/api/exam-groups', examGroupRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/seat-numbers', seatNumberRoutes);
app.use('/api/marks-entry-checklist', marksEntryChecklistRoutes);
app.use('/api/gracing-condonation-rule', gracingCondonationRuleRoutes);
app.use('/api/reassessments', reassessmentRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/exam-datesheet', examDatesheetRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Exam Management System API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});