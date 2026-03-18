const Reassessment = require('../models/Reassessment');
const Student = require('../models/Student');
const ExamTerm = require('../models/ExamTerm');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
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

// Get all reassessments
exports.getAllReassessments = async (req, res) => {
  try {
    const reassessments = await Reassessment.find({ isDeleted: false })
      .populate('student', 'studentId firstName lastName enrollmentNumber')
      .populate('examTerm', 'subject semester examDate')
      .populate('subject', 'subjectName subjectCode')
      .populate('facultyAssigned', 'name email department')
      .sort({ applicationDate: -1 });
    
    res.status(200).json(reassessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new reassessment
exports.createReassessment = async (req, res) => {
  try {
    const newReassessment = new Reassessment(req.body);
    const savedReassessment = await newReassessment.save();
    
    const populatedReassessment = await Reassessment.findById(savedReassessment._id)
      .populate('student', 'studentId firstName lastName enrollmentNumber')
      .populate('examTerm', 'subject semester examDate')
      .populate('subject', 'subjectName subjectCode')
      .populate('facultyAssigned', 'name email department');
    
    res.status(201).json(populatedReassessment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get reassessments by student
exports.getReassessmentsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const reassessments = await Reassessment.find({ 
      student: studentId, 
      isDeleted: false 
    })
      .populate('student', 'studentId firstName lastName enrollmentNumber')
      .populate('examTerm', 'subject semester examDate')
      .populate('subject', 'subjectName subjectCode')
      .populate('facultyAssigned', 'name email department')
      .sort({ applicationDate: -1 });
    
    res.status(200).json(reassessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign faculty to reassessment
exports.assignFaculty = async (req, res) => {
  try {
    const { reassessmentId, facultyId } = req.params;
    
    const updatedReassessment = await Reassessment.findByIdAndUpdate(
      reassessmentId,
      { 
        facultyAssigned: facultyId, 
        status: 'assigned',
        assignedDate: new Date()
      },
      { new: true }
    ).populate('student', 'studentId firstName lastName enrollmentNumber')
     .populate('examTerm', 'subject semester examDate')
     .populate('subject', 'subjectName subjectCode')
     .populate('facultyAssigned', 'name email department');
    
    if (!updatedReassessment) {
      return res.status(404).json({ message: 'Reassessment not found' });
    }
    
    res.status(200).json(updatedReassessment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update reassessment marks
exports.updateReassessmentMarks = async (req, res) => {
  try {
    const { reassessmentId } = req.params;
    const { reassessmentMarks, improvementMarks, nearestMarks, remarks } = req.body;
    
    const updateData = {
      reassessmentMarks,
      improvementMarks,
      nearestMarks,
      remarks,
      status: 'completed',
      completionDate: new Date()
    };
    
    const updatedReassessment = await Reassessment.findByIdAndUpdate(
      reassessmentId,
      updateData,
      { new: true }
    ).populate('student', 'studentId firstName lastName enrollmentNumber')
     .populate('examTerm', 'subject semester examDate')
     .populate('subject', 'subjectName subjectCode')
     .populate('facultyAssigned', 'name email department');
    
    if (!updatedReassessment) {
      return res.status(404).json({ message: 'Reassessment not found' });
    }
    
    res.status(200).json(updatedReassessment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Apply nearest marks
exports.applyNearestMarks = async (req, res) => {
  try {
    const { reassessmentId } = req.params;
    const { nearestMarks } = req.body;
    
    const updatedReassessment = await Reassessment.findByIdAndUpdate(
      reassessmentId,
      { 
        nearestMarks,
        status: 'approved',
        approvalDate: new Date()
      },
      { new: true }
    ).populate('student', 'studentId firstName lastName enrollmentNumber')
     .populate('examTerm', 'subject semester examDate')
     .populate('subject', 'subjectName subjectCode')
     .populate('facultyAssigned', 'name email department');
    
    if (!updatedReassessment) {
      return res.status(404).json({ message: 'Reassessment not found' });
    }
    
    res.status(200).json(updatedReassessment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get faculty assigned reassessments
exports.getFacultyReassessments = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const reassessments = await Reassessment.find({ 
      facultyAssigned: facultyId, 
      isDeleted: false 
    })
      .populate('student', 'studentId firstName lastName enrollmentNumber')
      .populate('examTerm', 'subject semester examDate')
      .populate('subject', 'subjectName subjectCode')
      .populate('facultyAssigned', 'name email department')
      .sort({ assignedDate: -1 });
    
    res.status(200).json(reassessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending reassessments
exports.getPendingReassessments = async (req, res) => {
  try {
    const reassessments = await Reassessment.find({ 
      status: 'pending', 
      isDeleted: false 
    })
      .populate('student', 'studentId firstName lastName enrollmentNumber')
      .populate('examTerm', 'subject semester examDate')
      .populate('subject', 'subjectName subjectCode')
      .sort({ applicationDate: -1 });
    
    res.status(200).json(reassessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Excel file for reassessments
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
      const reassessments = [];
      for (const row of data) {
        const reassessment = new Reassessment({
          student: row.student,
          examTerm: row.examTerm,
          subject: row.subject,
          originalMarks: row.originalMarks,
          reassessmentType: row.reassessmentType,
          feesAmount: row.feesAmount || 0,
          applicationDate: row.applicationDate || new Date(),
          remarks: row.remarks || ''
        });
        
        reassessments.push(reassessment);
      }
      
      // Save all reassessments
      const savedReassessments = await Reassessment.insertMany(reassessments);
      
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(201).json({
        message: `${savedReassessments.length} reassessments imported successfully`,
        reassessments: savedReassessments
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

// Soft delete a reassessment
exports.deleteReassessment = async (req, res) => {
  try {
    const reassessment = await Reassessment.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    
    if (!reassessment) {
      return res.status(404).json({ message: 'Reassessment not found' });
    }
    
    res.status(200).json({ message: 'Reassessment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};