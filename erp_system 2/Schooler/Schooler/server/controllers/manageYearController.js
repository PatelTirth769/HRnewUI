const xlsx = require('xlsx');
const path = require('path');
const ManageYear = require('../models/ManageYear');

const toDate = (value) => {
  if (!value) return undefined;

  if (typeof value === 'number') {
    // Excel serial date conversion
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return fallback;
};

// Get all active (non-deleted) years
exports.getActiveYears = async (req, res) => {
  try {
    const years = await ManageYear.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json(years);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching years', error: error.message });
  }
};

// Get all years (including deleted)
exports.getAllYears = async (req, res) => {
  try {
    const years = await ManageYear.find({}).sort({ createdAt: -1 });
    res.status(200).json(years);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all years', error: error.message });
  }
};

// Create a new year
exports.createYear = async (req, res) => {
  try {
    const payload = {
      yearId: req.body.yearId,
      year: req.body.year,
      instituteId: req.body.instituteId,
      academy: req.body.academy,
      startDate: toDate(req.body.startDate),
      endDate: toDate(req.body.endDate),
      finalYear: toBoolean(req.body.finalYear, false),
      active: toBoolean(req.body.active, true),
    };

    payload.isDeleted = !payload.active;
    const newYear = await ManageYear.create(payload);
    res.status(201).json(newYear);
  } catch (error) {
    res.status(400).json({ message: 'Error creating year', error: error.message });
  }
};

// Update an existing year
exports.updateYear = async (req, res) => {
  try {
    const { id } = req.params;
    const year = await ManageYear.findById(id);
    if (!year) {
      return res.status(404).json({ message: 'Year not found' });
    }

    year.yearId = req.body.yearId ?? year.yearId;
    year.year = req.body.year ?? year.year;
    year.instituteId = req.body.instituteId ?? year.instituteId;
    year.academy = req.body.academy ?? year.academy;
    year.startDate = toDate(req.body.startDate) ?? year.startDate;
    year.endDate = toDate(req.body.endDate) ?? year.endDate;

    if (req.body.finalYear !== undefined) {
      year.finalYear = toBoolean(req.body.finalYear, year.finalYear);
    }

    if (req.body.active !== undefined) {
      year.active = toBoolean(req.body.active, year.active);
      year.isDeleted = !year.active;
    }

    year.updatedAt = new Date();
    const updatedYear = await year.save();

    res.status(200).json(updatedYear);
  } catch (error) {
    res.status(400).json({ message: 'Error updating year', error: error.message });
  }
};

// Toggle year active status (and isDeleted)
exports.toggleYearStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const year = await ManageYear.findById(id);
    if (!year) {
      return res.status(404).json({ message: 'Year not found' });
    }

    year.active = !year.active;
    year.isDeleted = !year.active;
    year.updatedAt = new Date();

    const updatedYear = await year.save();
    res.status(200).json(updatedYear);
  } catch (error) {
    res.status(400).json({ message: 'Error toggling year status', error: error.message });
  }
};

// Upload Excel file
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const filePath = path.join(process.cwd(), req.file.path);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }
    
    // Validate required columns
    const requiredColumns = ['yearId', 'year', 'instituteId'];
    const firstRow = data[0];
    
    for (const column of requiredColumns) {
      if (!(column in firstRow)) {
        return res.status(400).json({ message: `Missing required column: ${column}` });
      }
    }
    
    // Process data
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const row of data) {
      try {
        const formattedRow = {
          yearId: row.yearId,
          year: row.year,
          instituteId: row.instituteId,
          academy: row.academy,
          startDate: toDate(row.startDate),
          endDate: toDate(row.endDate),
          finalYear: toBoolean(row.finalYear, false),
          active: toBoolean(row.active, true),
        };

        formattedRow.isDeleted = !formattedRow.active;

        const existingYear = await ManageYear.findOne({ yearId: formattedRow.yearId });

        if (existingYear) {
          Object.assign(existingYear, formattedRow, { updatedAt: new Date() });
          await existingYear.save();
          updatedCount++;
        } else {
          await ManageYear.create(formattedRow);
          insertedCount++;
        }
      } catch (error) {
        console.error('Error processing row:', error);
        skippedCount++;
      }
    }
    
    res.status(200).json({
      message: 'Excel file processed successfully',
      insertedCount,
      updatedCount,
      skippedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing Excel file', error: error.message });
  }
};