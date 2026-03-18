const mongoose = require('mongoose');

const marksEntryChecklistSchema = new mongoose.Schema({
  student: { type: String, required: true },
  admitCard: { type: String, required: true },
  roll: { type: String, required: true },
  divisionMarks: { type: String, required: true },
  lockedIdentity: { type: String, required: true },
  verifiedIdentity: { type: String, required: true },
  deviation: { type: String, required: true },
  score: { type: String, required: true },
});

module.exports = mongoose.model('MarksEntryChecklist', marksEntryChecklistSchema);