const City = require('../models/City');
const District = require('../models/District');
const State = require('../models/State');
const xlsx = require('xlsx');
const fs = require('fs');

// Get all cities (excluding deleted ones)
exports.getAllCities = async (req, res) => {
  try {
    const cities = await City.find({ isDeleted: false })
      .populate('stateId', 'stateId stateName')
      .populate('districtId', 'districtId districtName');
    res.status(200).json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get cities by district ID
exports.getCitiesByDistrict = async (req, res) => {
  try {
    const districtId = req.params.districtId;
    const cities = await City.find({ districtId, isDeleted: false });
    res.status(200).json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get cities by state ID
exports.getCitiesByState = async (req, res) => {
  try {
    const stateId = req.params.stateId;
    const cities = await City.find({ stateId, isDeleted: false });
    res.status(200).json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single city by ID
exports.getCity = async (req, res) => {
  try {
    const city = await City.findById(req.params.id)
      .populate('stateId', 'stateId stateName')
      .populate('districtId', 'districtId districtName');
    if (!city || city.isDeleted) {
      return res.status(404).json({ message: 'City not found' });
    }
    res.status(200).json(city);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new city
exports.createCity = async (req, res) => {
  try {
    const city = new City(req.body);
    const savedCity = await city.save();
    res.status(201).json(savedCity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a city
exports.updateCity = async (req, res) => {
  try {
    const city = await City.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!city || city.isDeleted) {
      return res.status(404).json({ message: 'City not found' });
    }
    res.status(200).json(city);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete a city
exports.deleteCity = async (req, res) => {
  try {
    const city = await City.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }
    res.status(200).json({ message: 'City deleted successfully' });
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
    const cities = [];
    for (const row of data) {
      if (!row.cityId || !row.cityName || !row.districtId || !row.stateId) {
        continue; // Skip invalid rows
      }

      // Find the state by stateId
      const state = await State.findOne({ stateId: row.stateId });
      if (!state) {
        continue; // Skip if state doesn't exist
      }

      // Find the district by districtId
      const district = await District.findOne({ districtId: row.districtId });
      if (!district) {
        continue; // Skip if district doesn't exist
      }

      // Check if city with this ID already exists
      const existingCity = await City.findOne({ cityId: row.cityId });
      if (existingCity) {
        // Update existing city
        existingCity.cityName = row.cityName;
        existingCity.stateId = state._id;
        existingCity.districtId = district._id;
        existingCity.isActive = row.isActive !== undefined ? row.isActive : true;
        existingCity.isDeleted = false; // Ensure it's not deleted
        await existingCity.save();
        cities.push(existingCity);
      } else {
        // Create new city
        const newCity = new City({
          cityId: row.cityId,
          cityName: row.cityName,
          stateId: state._id,
          districtId: district._id,
          isActive: row.isActive !== undefined ? row.isActive : true
        });
        await newCity.save();
        cities.push(newCity);
      }
    }

    res.status(200).json({ message: 'Excel data imported successfully', count: cities.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};