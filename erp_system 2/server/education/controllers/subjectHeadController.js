const SubjectHead = require('../models/SubjectHead');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

// Set up multer storage for file uploads
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
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  }
}).single('file');

// Get all subject heads
exports.getAllSubjectHeads = async (req, res) => {
  try {
    const subjectHeads = await SubjectHead.find({ isDeleted: false });
    res.status(200).json(subjectHeads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new subject head
exports.createSubjectHead = async (req, res) => {
  try {
    const subjectHead = new SubjectHead(req.body);
    const savedSubjectHead = await subjectHead.save();
    res.status(201).json(savedSubjectHead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a subject head by ID
exports.getSubjectHeadById = async (req, res) => {
  try {
    const subjectHead = await SubjectHead.findById(req.params.id);
    if (!subjectHead) {
      return res.status(404).json({ message: 'Subject head not found' });
    }
    res.status(200).json(subjectHead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a subject head
exports.updateSubjectHead = async (req, res) => {
  try {
    const updatedSubjectHead = await SubjectHead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedSubjectHead) {
      return res.status(404).json({ message: 'Subject head not found' });
    }
    res.status(200).json(updatedSubjectHead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete a subject head
exports.deleteSubjectHead = async (req, res) => {
  try {
    const subjectHead = await SubjectHead.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!subjectHead) {
      return res.status(404).json({ message: 'Subject head not found' });
    }
    res.status(200).json({ message: 'Subject head deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle active status
exports.toggleActiveStatus = async (req, res) => {
  try {
    const subjectHead = await SubjectHead.findById(req.params.id);
    if (!subjectHead) {
      return res.status(404).json({ message: 'Subject head not found' });
    }
    
    subjectHead.isActive = !subjectHead.isActive;
    await subjectHead.save();
    
    res.status(200).json(subjectHead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add examiner to a subject head
exports.addExaminer = async (req, res) => {
  try {
    const { id } = req.params;
    const { examiner } = req.body;
    
    if (!examiner) {
      return res.status(400).json({ message: 'Examiner name is required' });
    }
    
    const subjectHead = await SubjectHead.findById(id);
    if (!subjectHead) {
      return res.status(404).json({ message: 'Subject head not found' });
    }
    
    subjectHead.examiners.push(examiner);
    await subjectHead.save();
    
    res.status(200).json(subjectHead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove examiner from a subject head
exports.removeExaminer = async (req, res) => {
  try {
    const { id } = req.params;
    const { examinerIndex } = req.body;
    
    const subjectHead = await SubjectHead.findById(id);
    if (!subjectHead) {
      return res.status(404).json({ message: 'Subject head not found' });
    }
    
    if (examinerIndex < 0 || examinerIndex >= subjectHead.examiners.length) {
      return res.status(400).json({ message: 'Invalid examiner index' });
    }
    
    subjectHead.examiners.splice(examinerIndex, 1);
    await subjectHead.save();
    
    res.status(200).json(subjectHead);
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
      return res.status(400).json({ message: 'Please upload a file' });
    }
    
    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      
      // Validate data
      for (const item of data) {
        if (!item.instituteId || !item.year || !item.programId || !item.subjectName || !item.branch || !item.leadFacultyName) {
          return res.status(400).json({ message: 'Invalid data in Excel file. Missing required fields.' });
        }
      }
      
      // Process data
      const results = [];
      for (const item of data) {
        const examiners = [];
        
        // Check if there are examiners in the Excel file
        for (let i = 1; i <= 10; i++) {
          const examinerKey = `examiner${i}`;
          if (item[examinerKey] && item[examinerKey].trim() !== '') {
            examiners.push(item[examinerKey]);
          }
        }
        
        const subjectHead = new SubjectHead({
          instituteId: item.instituteId,
          year: item.year,
          programId: item.programId,
          subjectName: item.subjectName,
          branch: item.branch,
          leadFacultyName: item.leadFacultyName,
          examiners: examiners
        });
        
        const savedSubjectHead = await subjectHead.save();
        results.push(savedSubjectHead);
      }
      
      res.status(201).json({
        message: 'Excel file uploaded successfully',
        data: results
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};

// Download Excel template
exports.downloadTemplate = (req, res) => {
  try {
    const template = [
      {
        instituteId: 'INST001',
        year: '2023',
        programId: 'PROG001',
        subjectName: 'Mathematics',
        branch: 'Computer Science',
        leadFacultyName: 'Dr. John Doe',
        examiner1: 'Prof. Jane Smith',
        examiner2: 'Dr. Robert Johnson'
      }
    ];
    
    const worksheet = xlsx.utils.json_to_sheet(template);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=subject_head_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download all subject heads as Excel
exports.downloadExcel = async (req, res) => {
  try {
    const subjectHeads = await SubjectHead.find({ isDeleted: false });
    
    const data = subjectHeads.map(head => {
      const item = {
        instituteId: head.instituteId,
        year: head.year,
        programId: head.programId,
        subjectName: head.subjectName,
        branch: head.branch,
        leadFacultyName: head.leadFacultyName
      };
      
      // Add examiners
      head.examiners.forEach((examiner, index) => {
        item[`examiner${index + 1}`] = examiner;
      });
      
      return item;
    });
    
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Subject Heads');
    
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=subject_heads.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};