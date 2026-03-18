const mongoose = require('mongoose');

const examDatesheetSchema = new mongoose.Schema({
  course: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  day: {
    type: String,
    required: true,
  },
  subjectCode: {
    type: String,
    required: true,
  },
  subjectName: {
    type: String,
    required: true,
  },
  shift: {
    type: String,
    required: true,
  },
});

const ExamDatesheet = mongoose.model('ExamDatesheet', examDatesheetSchema);

module.exports = ExamDatesheet;