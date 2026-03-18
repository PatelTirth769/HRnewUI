const ExamDatesheet = require('../models/ExamDatesheet');
const xlsx = require('xlsx');

// @desc    Get all exam datesheets
// @route   GET /api/exam-datesheet
// @access  Public
const getExamDatesheets = async (req, res) => {
  try {
    const datesheets = await ExamDatesheet.find();
    res.status(200).json(datesheets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload exam datesheet
// @route   POST /api/exam-datesheet/upload
// @access  Admin
const uploadExamDatesheet = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Clear existing datesheet data
    await ExamDatesheet.deleteMany({});

    // Insert new datesheet data
    await ExamDatesheet.insertMany(data);

    res.status(201).json({ message: 'Datesheet uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExamDatesheets,
  uploadExamDatesheet,
};