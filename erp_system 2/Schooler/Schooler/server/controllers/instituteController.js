const Institute = require('../models/Institute');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Get all institutes (excluding soft deleted)
exports.getAllInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.find({ isDeleted: false });
    res.status(200).json(institutes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single institute by ID
exports.getInstituteById = async (req, res) => {
  try {
    const institute = await Institute.findOne({ _id: req.params.id, isDeleted: false });
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }
    res.status(200).json(institute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new institute
exports.createInstitute = async (req, res) => {
  try {
    const { instituteId, instituteName, instituteCertificationNumber, active } = req.body;
    
    // Check if institute with same ID already exists
    const existingInstitute = await Institute.findOne({ instituteId, isDeleted: false });
    if (existingInstitute) {
      return res.status(400).json({ message: 'Institute with this ID already exists' });
    }
    
    const newInstitute = new Institute({
      instituteId,
      instituteName,
      instituteCertificationNumber,
      active
    });
    
    const savedInstitute = await newInstitute.save();
    res.status(201).json(savedInstitute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an institute
exports.updateInstitute = async (req, res) => {
  try {
    const { instituteId, instituteName, instituteCertificationNumber, active } = req.body;
    
    // Check if another institute with same ID exists (excluding current one)
    const existingInstitute = await Institute.findOne({ 
      instituteId, 
      _id: { $ne: req.params.id },
      isDeleted: false 
    });
    
    if (existingInstitute) {
      return res.status(400).json({ message: 'Another institute with this ID already exists' });
    }
    
    const updatedInstitute = await Institute.findByIdAndUpdate(
      req.params.id,
      { instituteId, instituteName, instituteCertificationNumber, active },
      { new: true }
    );
    
    if (!updatedInstitute) {
      return res.status(404).json({ message: 'Institute not found' });
    }
    
    res.status(200).json(updatedInstitute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soft delete an institute
exports.deleteInstitute = async (req, res) => {
  try {
    const deletedInstitute = await Institute.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    
    if (!deletedInstitute) {
      return res.status(404).json({ message: 'Institute not found' });
    }
    
    res.status(200).json({ message: 'Institute deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Excel file
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    // Validate data
    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }
    
    // Check required fields
    const requiredFields = ['instituteId', 'instituteName', 'instituteCertificationNumber'];
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!data[0].hasOwnProperty(field)) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Excel file is missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    // Process data
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const item of data) {
      try {
        // Check if institute already exists
        const existingInstitute = await Institute.findOne({ 
          instituteId: item.instituteId,
          isDeleted: false
        });
        
        if (existingInstitute) {
          // Update existing institute
          await Institute.findByIdAndUpdate(existingInstitute._id, {
            instituteName: item.instituteName,
            instituteCertificationNumber: item.instituteCertificationNumber,
            active: item.active !== undefined ? item.active : true
          });
        } else {
          // Create new institute
          const newInstitute = new Institute({
            instituteId: item.instituteId,
            instituteName: item.instituteName,
            instituteCertificationNumber: item.instituteCertificationNumber,
            active: item.active !== undefined ? item.active : true
          });
          
          await newInstitute.save();
        }
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: item,
          error: error.message
        });
      }
    }
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    res.status(200).json({
      message: 'Excel data processed',
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};