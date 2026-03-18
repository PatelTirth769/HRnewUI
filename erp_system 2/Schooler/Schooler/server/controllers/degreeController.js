const Degree = require('../models/Degree');
const xlsx = require('xlsx');
const fs = require('fs');

// Get all degrees
exports.getAllDegrees = async (req, res) => {
  try {
    const degrees = await Degree.find();
    res.status(200).json(degrees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get degree by ID
exports.getDegreeById = async (req, res) => {
  try {
    const degree = await Degree.findById(req.params.id);
    if (!degree) {
      return res.status(404).json({ message: 'Degree not found' });
    }
    res.status(200).json(degree);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new degree
exports.createDegree = async (req, res) => {
  try {
    const newDegree = new Degree(req.body);
    const savedDegree = await newDegree.save();
    res.status(201).json(savedDegree);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update degree
exports.updateDegree = async (req, res) => {
  try {
    const updatedDegree = await Degree.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedDegree) {
      return res.status(404).json({ message: 'Degree not found' });
    }
    res.status(200).json(updatedDegree);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete degree
exports.deleteDegree = async (req, res) => {
  try {
    const degree = await Degree.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!degree) {
      return res.status(404).json({ message: 'Degree not found' });
    }
    res.status(200).json({ message: 'Degree deleted successfully' });
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

    // Remove the temporary file
    fs.unlinkSync(req.file.path);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    // Validate and process each row
    const degrees = [];
    for (const row of data) {
      if (!row.degreeId || !row.degreeName || !row.instituteId) {
        continue; // Skip invalid rows
      }

      // Check if degree with same ID already exists
      const existingDegree = await Degree.findOne({ degreeId: row.degreeId });
      if (existingDegree) {
        // Update existing degree
        existingDegree.degreeName = row.degreeName;
        existingDegree.specialization = row.specialization || '';
        existingDegree.parentDegree = row.parentDegree || '';
        existingDegree.instituteId = row.instituteId;
        existingDegree.active = row.active !== undefined ? row.active : true;
        await existingDegree.save();
        degrees.push(existingDegree);
      } else {
        // Create new degree
        const newDegree = new Degree({
          degreeId: row.degreeId,
          degreeName: row.degreeName,
          specialization: row.specialization || '',
          parentDegree: row.parentDegree || '',
          instituteId: row.instituteId,
          active: row.active !== undefined ? row.active : true
        });
        await newDegree.save();
        degrees.push(newDegree);
      }
    }

    res.status(200).json({
      message: `${degrees.length} degrees processed successfully`,
      degrees
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export to Excel
exports.exportToExcel = async (req, res) => {
  try {
    const degrees = await Degree.find();
    
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(degrees.map(degree => ({
      degreeId: degree.degreeId,
      degreeName: degree.degreeName,
      specialization: degree.specialization,
      parentDegree: degree.parentDegree,
      instituteId: degree.instituteId,
      active: degree.active
    })));
    
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Degrees');
    
    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=degrees.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};