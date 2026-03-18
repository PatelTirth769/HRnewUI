const State = require('../models/State');
const xlsx = require('xlsx');
const fs = require('fs');

// Get all states (excluding deleted ones)
exports.getAllStates = async (req, res) => {
  try {
    const states = await State.find({ isDeleted: false });
    res.status(200).json(states);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single state by ID
exports.getState = async (req, res) => {
  try {
    const state = await State.findById(req.params.id);
    if (!state || state.isDeleted) {
      return res.status(404).json({ message: 'State not found' });
    }
    res.status(200).json(state);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new state
exports.createState = async (req, res) => {
  try {
    const state = new State(req.body);
    const savedState = await state.save();
    res.status(201).json(savedState);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a state
exports.updateState = async (req, res) => {
  try {
    const state = await State.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!state || state.isDeleted) {
      return res.status(404).json({ message: 'State not found' });
    }
    res.status(200).json(state);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete a state
exports.deleteState = async (req, res) => {
  try {
    const state = await State.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!state) {
      return res.status(404).json({ message: 'State not found' });
    }
    res.status(200).json({ message: 'State deleted successfully' });
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
    const states = [];
    for (const row of data) {
      if (!row.stateId || !row.stateName) {
        continue; // Skip invalid rows
      }

      // Check if state with this ID already exists
      const existingState = await State.findOne({ stateId: row.stateId });
      if (existingState) {
        // Update existing state
        existingState.stateName = row.stateName;
        existingState.isActive = row.isActive !== undefined ? row.isActive : true;
        existingState.isDeleted = false; // Ensure it's not deleted
        await existingState.save();
        states.push(existingState);
      } else {
        // Create new state
        const newState = new State({
          stateId: row.stateId,
          stateName: row.stateName,
          isActive: row.isActive !== undefined ? row.isActive : true
        });
        await newState.save();
        states.push(newState);
      }
    }

    res.status(200).json({ message: 'Excel data imported successfully', count: states.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};