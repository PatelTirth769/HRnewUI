const ManageExamCenter = require('../models/ManageExamCenter');
const xlsx = require('xlsx');
const fs = require('fs');

// Get all exam centers
exports.getAllExamCenters = async (req, res) => {
  try {
    const examCenters = await ManageExamCenter.find({ isDeleted: false });
    res.status(200).json(examCenters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single exam center
exports.getExamCenter = async (req, res) => {
  try {
    const examCenter = await ManageExamCenter.findById(req.params.id);
    if (!examCenter || examCenter.isDeleted) {
      return res.status(404).json({ message: 'Exam center not found' });
    }
    res.status(200).json(examCenter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new exam center
exports.createExamCenter = async (req, res) => {
  try {
    const examCenter = new ManageExamCenter(req.body);
    const savedExamCenter = await examCenter.save();
    res.status(201).json(savedExamCenter);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an exam center
exports.updateExamCenter = async (req, res) => {
  try {
    const examCenter = await ManageExamCenter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!examCenter || examCenter.isDeleted) {
      return res.status(404).json({ message: 'Exam center not found' });
    }
    res.status(200).json(examCenter);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete an exam center
exports.deleteExamCenter = async (req, res) => {
  try {
    const examCenter = await ManageExamCenter.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!examCenter) {
      return res.status(404).json({ message: 'Exam center not found' });
    }
    res.status(200).json({ message: 'Exam center deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Excel file
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Remove the file after processing
    fs.unlinkSync(req.file.path);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const results = [];
    const errors = [];

    for (const row of data) {
      try {
        // Check if required fields are present
        const requiredFields = [
          'examCenterId', 'examCenterName', 'examCenterAddress1',
          'cityId', 'stateId', 'pin', 'contactNumber',
          'examParentInstituteId', 'examParentInstituteName', 'instituteId'
        ];

        const missingFields = requiredFields.filter(field => !row[field]);
        if (missingFields.length > 0) {
          errors.push({ row, error: `Missing required fields: ${missingFields.join(', ')}` });
          continue;
        }

        // Check if exam center with same ID already exists
        const existingExamCenter = await ManageExamCenter.findOne({ examCenterId: row.examCenterId });
        if (existingExamCenter) {
          // Update existing record
          const updatedExamCenter = await ManageExamCenter.findByIdAndUpdate(
            existingExamCenter._id,
            { ...row, isDeleted: false },
            { new: true }
          );
          results.push(updatedExamCenter);
        } else {
          // Create new record
          const newExamCenter = new ManageExamCenter({
            ...row,
            isActive: row.isActive === 'Y' || row.isActive === 'y' || row.isActive === true,
          });
          const savedExamCenter = await newExamCenter.save();
          results.push(savedExamCenter);
        }
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    res.status(200).json({
      message: 'Excel file processed successfully',
      results,
      errors,
      totalProcessed: data.length,
      successCount: results.length,
      errorCount: errors.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};