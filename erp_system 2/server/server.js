import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Routes
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Education (Schooler) routes loaded from vendored server source
const educationBasePath = path.resolve(__dirname, './education');
const manageYearRoutes = require(path.join(educationBasePath, 'routes/manageYearRoutes.js'));
const manageExamCenterRoutes = require(path.join(educationBasePath, 'routes/manageExamCenterRoutes.js'));
const stateRoutes = require(path.join(educationBasePath, 'routes/stateRoutes.js'));
const districtRoutes = require(path.join(educationBasePath, 'routes/districtRoutes.js'));
const cityRoutes = require(path.join(educationBasePath, 'routes/cityRoutes.js'));
const instituteRoutes = require(path.join(educationBasePath, 'routes/instituteRoutes.js'));
const degreeRoutes = require(path.join(educationBasePath, 'routes/degreeRoutes.js'));
const studentRoutes = require(path.join(educationBasePath, 'routes/studentRoutes.js'));
const yearConfigurationRoutes = require(path.join(educationBasePath, 'routes/yearConfigurationRoutes.js'));
const programRoutes = require(path.join(educationBasePath, 'routes/programRoutes.js'));
const examTermRoutes = require(path.join(educationBasePath, 'routes/examTermRoutes.js'));
const examGroupRoutes = require(path.join(educationBasePath, 'routes/examGroupRoutes.js'));
const subjectRoutes = require(path.join(educationBasePath, 'routes/subjectRoutes.js'));
const seatNumberRoutes = require(path.join(educationBasePath, 'routes/seatNumberRoutes.js'));
const marksEntryChecklistRoutes = require(path.join(educationBasePath, 'routes/marksEntryChecklistRoutes.js'));
const gracingCondonationRuleRoutes = require(path.join(educationBasePath, 'routes/gracingCondonationRule.js'));
const reassessmentRoutes = require(path.join(educationBasePath, 'routes/reassessmentRoutes.js'));
const facultyRoutes = require(path.join(educationBasePath, 'routes/facultyRoutes.js'));
const examDatesheetRoutes = require(path.join(educationBasePath, 'routes/examDatesheetRoutes.js'));

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api/education/uploads', express.static(path.join(educationBasePath, 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/education/manage-year', manageYearRoutes);
app.use('/api/education/manage-exam-center', manageExamCenterRoutes);
app.use('/api/education/states', stateRoutes);
app.use('/api/education/districts', districtRoutes);
app.use('/api/education/cities', cityRoutes);
app.use('/api/education/institutes', instituteRoutes);
app.use('/api/education/degrees', degreeRoutes);
app.use('/api/education/students', studentRoutes);
app.use('/api/education/year-configurations', yearConfigurationRoutes);
app.use('/api/education/programs', programRoutes);
app.use('/api/education/exam-terms', examTermRoutes);
app.use('/api/education/exam-groups', examGroupRoutes);
app.use('/api/education/subjects', subjectRoutes);
app.use('/api/education/seat-numbers', seatNumberRoutes);
app.use('/api/education/marks-entry-checklist', marksEntryChecklistRoutes);
app.use('/api/education/gracing-condonation-rule', gracingCondonationRuleRoutes);
app.use('/api/education/reassessments', reassessmentRoutes);
app.use('/api/education/faculties', facultyRoutes);
app.use('/api/education/exam-datesheet', examDatesheetRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});