const SeatNumber = require('../models/SeatNumber');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const QRCode = require('qrcode');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/seatnumbers');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  }
}).single('excelFile');

// Generate QR code for a seat number
const generateQRCode = async (seatData) => {
  try {
    const data = JSON.stringify({
      seatNo: seatData.examSeatNo,
      studentId: seatData.studentId,
      studentName: seatData.studentName,
      enrollmentNo: seatData.enrollmentNo,
      blockNo: seatData.examBlockNo,
      roomNo: seatData.examRoomNo,
      program: seatData.programName
    });
    
    const qrCodeDataURL = await QRCode.toDataURL(data);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

// Create a new seat number
exports.createSeatNumber = async (req, res) => {
  try {
    const seatData = req.body;
    
    // Generate QR code
    const qrCode = await generateQRCode(seatData);
    seatData.qrCode = qrCode;
    
    const newSeatNumber = new SeatNumber(seatData);
    const savedSeatNumber = await newSeatNumber.save();
    
    res.status(201).json({
      success: true,
      data: savedSeatNumber
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Upload Excel file and create seat numbers
exports.uploadExcelFile = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }
    
    try {
      const filePath = req.file.path;
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty'
        });
      }
      
      const seatNumbers = [];
      
      for (const row of data) {
        // Validate required fields
        const requiredFields = ['instituteId', 'yearId', 'examFacultyId', 'examBlockNo', 'examRoomNo', 'examSeatNo', 'studentId', 'studentName', 'enrollmentNo', 'programId', 'programName'];
        const missingFields = requiredFields.filter(field => !row[field]);
        
        if (missingFields.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missingFields.join(', ')}`
          });
        }
        
        // Generate QR code
        const qrCode = await generateQRCode(row);
        
        const seatNumber = new SeatNumber({
          ...row,
          qrCode
        });
        
        const savedSeatNumber = await seatNumber.save();
        seatNumbers.push(savedSeatNumber);
      }
      
      // Delete the uploaded file after processing
      fs.unlinkSync(filePath);
      
      res.status(201).json({
        success: true,
        message: `${seatNumbers.length} seat numbers created successfully`,
        data: seatNumbers
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  });
};

// Get all seat numbers
exports.getAllSeatNumbers = async (req, res) => {
  try {
    const seatNumbers = await SeatNumber.find();
    
    res.status(200).json({
      success: true,
      count: seatNumbers.length,
      data: seatNumbers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get seat numbers by filters
exports.getSeatNumbersByFilters = async (req, res) => {
  try {
    const { instituteId, yearId, examFacultyId, examBlockNo, examRoomNo } = req.query;
    
    const filter = {};
    
    if (instituteId) filter.instituteId = instituteId;
    if (yearId) filter.yearId = yearId;
    if (examFacultyId) filter.examFacultyId = examFacultyId;
    if (examBlockNo) filter.examBlockNo = examBlockNo;
    if (examRoomNo) filter.examRoomNo = examRoomNo;
    
    const seatNumbers = await SeatNumber.find(filter);
    
    res.status(200).json({
      success: true,
      count: seatNumbers.length,
      data: seatNumbers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single seat number
exports.getSeatNumber = async (req, res) => {
  try {
    const seatNumber = await SeatNumber.findById(req.params.id);
    
    if (!seatNumber) {
      return res.status(404).json({
        success: false,
        message: 'Seat number not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: seatNumber
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update a seat number
exports.updateSeatNumber = async (req, res) => {
  try {
    const seatNumber = await SeatNumber.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!seatNumber) {
      return res.status(404).json({
        success: false,
        message: 'Seat number not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: seatNumber
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a seat number
exports.deleteSeatNumber = async (req, res) => {
  try {
    const seatNumber = await SeatNumber.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    
    if (!seatNumber) {
      return res.status(404).json({
        success: false,
        message: 'Seat number not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Seat number deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};