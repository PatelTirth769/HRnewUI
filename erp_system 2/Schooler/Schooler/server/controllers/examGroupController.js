const ExamGroup = require('../models/ExamGroup');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
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

// Get all exam groups
exports.getAllExamGroups = async (req, res) => {
  try {
    const examGroups = await ExamGroup.find({ isDeleted: false })
      .populate('year')
      .sort({ createdAt: -1 });
    res.status(200).json(examGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new exam group
exports.createExamGroup = async (req, res) => {
  try {
    const examGroup = new ExamGroup(req.body);
    const savedExamGroup = await examGroup.save();
    res.status(201).json(savedExamGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a single exam group
exports.getExamGroup = async (req, res) => {
  try {
    const examGroup = await ExamGroup.findById(req.params.id).populate('year');
    if (!examGroup) {
      return res.status(404).json({ message: 'Exam group not found' });
    }
    res.status(200).json(examGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an exam group
exports.updateExamGroup = async (req, res) => {
  try {
    const examGroup = await ExamGroup.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('year');
    
    if (!examGroup) {
      return res.status(404).json({ message: 'Exam group not found' });
    }
    
    res.status(200).json(examGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete an exam group
exports.deleteExamGroup = async (req, res) => {
  try {
    const examGroup = await ExamGroup.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    
    if (!examGroup) {
      return res.status(404).json({ message: 'Exam group not found' });
    }
    
    res.status(200).json({ message: 'Exam group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle active status
exports.toggleActiveStatus = async (req, res) => {
  try {
    const examGroup = await ExamGroup.findById(req.params.id);
    
    if (!examGroup) {
      return res.status(404).json({ message: 'Exam group not found' });
    }
    
    examGroup.isActive = !examGroup.isActive;
    await examGroup.save();
    
    res.status(200).json(examGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Excel file
exports.uploadExcel = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }
    
    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      
      const examGroups = [];
      
      for (const row of data) {
        const examGroup = new ExamGroup({
          groupName: row.groupName,
          year: row.year,
          specialization: row.specialization,
          courses: row.courses ? row.courses.split(',').map(course => course.trim()) : [],
          isActive: row.isActive === 'Yes' || row.isActive === true
        });
        
        await examGroup.save();
        examGroups.push(examGroup);
      }
      
      res.status(201).json({ message: 'Excel file uploaded successfully', examGroups });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};