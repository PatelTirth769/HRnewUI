const District = require('../models/District');
const State = require('../models/State');
const xlsx = require('xlsx');
const fs = require('fs');

// Get all districts (excluding deleted ones)
exports.getAllDistricts = async (req, res) => {
  try {
    const districts = await District.find({ isDeleted: false })
      .populate('stateId', 'stateId stateName');
    res.status(200).json(districts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get districts by state ID
exports.getDistrictsByState = async (req, res) => {
  try {
    const stateId = req.params.stateId;
    const districts = await District.find({ stateId, isDeleted: false });
    res.status(200).json(districts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single district by ID
exports.getDistrict = async (req, res) => {
  try {
    const district = await District.findById(req.params.id)
      .populate('stateId', 'stateId stateName');
    if (!district || district.isDeleted) {
      return res.status(404).json({ message: 'District not found' });
    }
    res.status(200).json(district);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new district
exports.createDistrict = async (req, res) => {
  try {
    const district = new District(req.body);
    const savedDistrict = await district.save();
    res.status(201).json(savedDistrict);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a district
exports.updateDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!district || district.isDeleted) {
      return res.status(404).json({ message: 'District not found' });
    }
    res.status(200).json(district);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete a district
exports.deleteDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    res.status(200).json({ message: 'District deleted successfully' });
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
    const districts = [];
    for (const row of data) {
      if (!row.districtId || !row.districtName || !row.stateId) {
        continue; // Skip invalid rows
      }

      // Find the state by stateId
      const state = await State.findOne({ stateId: row.stateId });
      if (!state) {
        continue; // Skip if state doesn't exist
      }

      // Check if district with this ID already exists
      const existingDistrict = await District.findOne({ districtId: row.districtId });
      if (existingDistrict) {
        // Update existing district
        existingDistrict.districtName = row.districtName;
        existingDistrict.stateId = state._id;
        existingDistrict.isActive = row.isActive !== undefined ? row.isActive : true;
        existingDistrict.isDeleted = false; // Ensure it's not deleted
        await existingDistrict.save();
        districts.push(existingDistrict);
      } else {
        // Create new district
        const newDistrict = new District({
          districtId: row.districtId,
          districtName: row.districtName,
          stateId: state._id,
          isActive: row.isActive !== undefined ? row.isActive : true
        });
        await newDistrict.save();
        districts.push(newDistrict);
      }
    }

    res.status(200).json({ message: 'Excel data imported successfully', count: districts.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};