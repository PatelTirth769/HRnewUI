const ExamTerm = require('../models/ExamTerm');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Set up storage for Excel uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  }
}).single('file');

// Get all exam terms
exports.getAllExamTerms = async (req, res) => {
  try {
    const examTerms = await ExamTerm.find({ isDeleted: false })
      .populate('year')
      .populate('program');
    
    res.status(200).json(examTerms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new exam term
exports.createExamTerm = async (req, res) => {
  try {
    const newExamTerm = new ExamTerm(req.body);
    const savedExamTerm = await newExamTerm.save();
    
    const populatedExamTerm = await ExamTerm.findById(savedExamTerm._id)
      .populate('year', 'yearId year')
      .populate('program', 'programId programName');
    
    res.status(201).json(populatedExamTerm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a single exam term by ID
exports.getExamTermById = async (req, res) => {
  try {
    const examTerm = await ExamTerm.findById(req.params.id)
      .populate('year', 'yearId year')
      .populate('program', 'programId programName');
    
    if (!examTerm) {
      return res.status(404).json({ message: 'Exam term not found' });
    }
    
    res.status(200).json(examTerm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an exam term
exports.updateExamTerm = async (req, res) => {
  try {
    const updatedExamTerm = await ExamTerm.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('year', 'yearId year')
     .populate('program', 'programId programName');
    
    if (!updatedExamTerm) {
      return res.status(404).json({ message: 'Exam term not found' });
    }
    
    res.status(200).json(updatedExamTerm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete an exam term
exports.deleteExamTerm = async (req, res) => {
  try {
    const examTerm = await ExamTerm.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    
    if (!examTerm) {
      return res.status(404).json({ message: 'Exam term not found' });
    }
    
    res.status(200).json({ message: 'Exam term deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Excel file
exports.uploadExcel = (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }
    
    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      
      // Process and validate the data
      const examTerms = [];
      for (const row of data) {
        const examTerm = new ExamTerm({
          year: row.year,
          program: row.program,
          semester: row.semester,
          subject: row.subject,
          practical: row.practical,
          assignment: row.assignment,
          examDate: row.examDate,
          gradingSystem: row.gradingSystem,
          isActive: row.isActive === 'Yes' || row.isActive === true
        });
        
        examTerms.push(examTerm);
      }
      
      // Save all exam terms
      const savedExamTerms = await ExamTerm.insertMany(examTerms);
      
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(201).json({
        message: `${savedExamTerms.length} exam terms imported successfully`,
        examTerms: savedExamTerms
      });
    } catch (error) {
      // Delete the uploaded file in case of error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: error.message });
    }
  });
};