const mongoose = require('mongoose');

const gracingCondonationRuleSchema = new mongoose.Schema({
  university: { type: String, required: true },
  semester: { type: String, required: true },
  year: { type: String, required: true },
  exam: { type: String, required: true },
  rules: [
    {
      rule: { type: String, required: true },
      totalMarks: { type: String, required: true },
      totalYearSemester: { type: String, required: true },
      pass: { type: String, required: true },
      variation: { type: String, required: true },
      fail: { type: String, required: true },
      grace: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model('GracingCondonationRule', gracingCondonationRuleSchema);