const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
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

// Get all faculties
exports.getAllFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find({ isDeleted: false })
      .populate('subjects', 'subjectName subjectCode')
      .sort({ name: 1 });
    
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new faculty
exports.createFaculty = async (req, res) => {
  try {
    const newFaculty = new Faculty(req.body);
    const savedFaculty = await newFaculty.save();
    
    const populatedFaculty = await Faculty.findById(savedFaculty._id)
      .populate('subjects', 'subjectName subjectCode');
    
    res.status(201).json(populatedFaculty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a single faculty by ID
exports.getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('subjects', 'subjectName subjectCode');
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    res.status(200).json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a faculty
exports.updateFaculty = async (req, res) => {
  try {
    const updatedFaculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('subjects', 'subjectName subjectCode');
    
    if (!updatedFaculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    res.status(200).json(updatedFaculty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get faculties by department
exports.getFacultiesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const faculties = await Faculty.find({ 
      department: department, 
      isDeleted: false 
    })
      .populate('subjects', 'subjectName subjectCode')
      .sort({ name: 1 });
    
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get faculties by subject
exports.getFacultiesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const faculties = await Faculty.find({ 
      subjects: subjectId, 
      isDeleted: false 
    })
      .populate('subjects', 'subjectName subjectCode')
      .sort({ name: 1 });
    
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get available faculties for reassignment
exports.getAvailableFaculties = async (req, res) => {
  try {
    const { subjectId } = req.query;
    
    let query = { isDeleted: false, isActive: true };
    
    if (subjectId) {
      query.subjects = subjectId;
    }
    
    const faculties = await Faculty.find(query)
      .populate('subjects', 'subjectName subjectCode')
      .sort({ name: 1 });
    
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Excel file for faculties
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
      const faculties = [];
      for (const row of data) {
        const faculty = new Faculty({
          facultyId: row.facultyId,
          name: row.name,
          email: row.email,
          department: row.department,
          designation: row.designation,
          phone: row.phone,
          qualifications: row.qualifications ? row.qualifications.split(',').map(q => q.trim()) : [],
          experience: row.experience || 0,
          specialization: row.specialization ? row.specialization.split(',').map(s => s.trim()) : [],
          subjects: row.subjects ? row.subjects.split(',').map(s => s.trim()) : [],
          isActive: row.isActive === 'Yes' || row.isActive === true
        });
        
        faculties.push(faculty);
      }
      
      // Save all faculties
      const savedFaculties = await Faculty.insertMany(faculties);
      
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(201).json({
        message: `${savedFaculties.length} faculties imported successfully`,
        faculties: savedFaculties
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

// Soft delete a faculty
exports.deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    res.status(200).json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};