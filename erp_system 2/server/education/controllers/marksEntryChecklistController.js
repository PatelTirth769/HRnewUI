const multer = require('multer');
const xlsx = require('xlsx');
const MarksEntryChecklist = require('../models/MarksEntryChecklist');

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const getChecklistData = async (req, res) => {
  try {
    const checklistData = await MarksEntryChecklist.find(req.query);
    res.json(checklistData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadChecklistData = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      await MarksEntryChecklist.insertMany(data);

      res.json({ message: 'File uploaded and data saved successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
];

const downloadChecklistData = async (req, res) => {
  try {
    const checklistData = await MarksEntryChecklist.find(req.query);

    const worksheet = xlsx.utils.json_to_sheet(checklistData.map(item => item.toObject()));
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'ChecklistData');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=checklist_data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getChecklistData,
  uploadChecklistData,
  downloadChecklistData,
};