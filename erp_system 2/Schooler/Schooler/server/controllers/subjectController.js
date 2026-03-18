const Subject = require('../models/Subject');
const axios = require('axios');
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

// Fetch exam subjects from old system
exports.fetchExamSubjects = async (req, res) => {
  try {
    // This is a mock implementation - in real scenario, you would connect to the old system API
    // const response = await axios.get('https://old-system-api.com/exam-subjects');
    // const examSubjects = response.data;
    
    // Mock data for demonstration
    const examSubjects = [
      { id: 'ES001', name: 'Mathematics' },
      { id: 'ES002', name: 'Physics' },
      { id: 'ES003', name: 'Chemistry' },
      { id: 'ES004', name: 'Biology' },
      { id: 'ES005', name: 'Computer Science' }
    ];
    
    res.status(200).json(examSubjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch academic subjects from old system
exports.fetchAcademicSubjects = async (req, res) => {
  try {
    // This is a mock implementation - in real scenario, you would connect to the old system API
    // const response = await axios.get('https://old-system-api.com/academic-subjects');
    // const academicSubjects = response.data;
    
    // Mock data for demonstration
    const academicSubjects = [
      { id: 'AS001', name: 'Advanced Mathematics' },
      { id: 'AS002', name: 'Applied Physics' },
      { id: 'AS003', name: 'Organic Chemistry' },
      { id: 'AS004', name: 'Molecular Biology' },
      { id: 'AS005', name: 'Programming' }
    ];
    
    res.status(200).json(academicSubjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all subjects (mapped and unmapped)
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isDeleted: false })
      .sort({ createdAt: -1 });
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get unmapped subjects
exports.getUnmappedSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ 
      isDeleted: false,
      isMapped: false
    }).sort({ createdAt: -1 });
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Map exam subject to academic subject
exports.mapSubjects = async (req, res) => {
  try {
    const { examSubjectId, academicSubjectId } = req.body;
    
    // Find if the subject mapping already exists
    let subject = await Subject.findOne({
      examSubjectId,
      academicSubjectId
    });
    
    if (subject) {
      // Update existing mapping
      subject.isMapped = true;
      await subject.save();
    } else {
      // Create new mapping
      subject = new Subject({
        examSubjectId: req.body.examSubjectId,
        examSubjectName: req.body.examSubjectName,
        academicSubjectId: req.body.academicSubjectId,
        academicSubjectName: req.body.academicSubjectName,
        isMapped: true
      });
      await subject.save();
    }
    
    res.status(200).json(subject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Unmap subjects
exports.unmapSubjects = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject mapping not found' });
    }
    
    subject.isMapped = false;
    await subject.save();
    
    res.status(200).json(subject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Upload Excel file for bulk mapping
exports.uploadExcel = (req, res) => {
  upload(req, res, async function(err) {
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
      
      const results = [];
      
      for (const row of data) {
        // Validate required fields
        if (!row.examSubjectId || !row.academicSubjectId) {
          continue;
        }
        
        // Find if the subject mapping already exists
        let subject = await Subject.findOne({
          examSubjectId: row.examSubjectId,
          academicSubjectId: row.academicSubjectId
        });
        
        if (subject) {
          // Update existing mapping
          subject.examSubjectName = row.examSubjectName || subject.examSubjectName;
          subject.academicSubjectName = row.academicSubjectName || subject.academicSubjectName;
          subject.isMapped = true;
          await subject.save();
        } else {
          // Create new mapping
          subject = new Subject({
            examSubjectId: row.examSubjectId,
            examSubjectName: row.examSubjectName,
            academicSubjectId: row.academicSubjectId,
            academicSubjectName: row.academicSubjectName,
            isMapped: true
          });
          await subject.save();
        }
        
        results.push(subject);
      }
      
      res.status(200).json({
        message: `${results.length} subject mappings processed successfully`,
        data: results
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};

// Download Excel template
exports.downloadExcelTemplate = (req, res) => {
  try {
    // Create a new workbook
    const workbook = xlsx.utils.book_new();
    
    // Sample data for the template
    const templateData = [
      {
        examSubjectId: 'ES001',
        examSubjectName: 'Mathematics',
        academicSubjectId: 'AS001',
        academicSubjectName: 'Advanced Mathematics'
      }
    ];
    
    // Create a worksheet
    const worksheet = xlsx.utils.json_to_sheet(templateData);
    
    // Add the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Subject Mapping');
    
    // Set the response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=subject_mapping_template.xlsx');
    
    // Write the workbook to the response
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download all subject mappings as Excel
exports.downloadSubjectMappings = async (req, res) => {
  try {
    // Get all subjects
    const subjects = await Subject.find({ isDeleted: false });
    
    // Create a new workbook
    const workbook = xlsx.utils.book_new();
    
    // Format the data for Excel
    const excelData = subjects.map(subject => ({
      examSubjectId: subject.examSubjectId,
      examSubjectName: subject.examSubjectName,
      academicSubjectId: subject.academicSubjectId,
      academicSubjectName: subject.academicSubjectName,
      isMapped: subject.isMapped ? 'Yes' : 'No'
    }));
    
    // Create a worksheet
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Add the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Subject Mappings');
    
    // Set the response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=subject_mappings.xlsx');
    
    // Write the workbook to the response
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};