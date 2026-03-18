const GracingCondonationRule = require('../models/gracingCondonationRule');

exports.createGracingCondonationRule = async (req, res) => {
  try {
    const newRule = new GracingCondonationRule(req.body);
    await newRule.save();
    res.status(201).json(newRule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getGracingCondonationRules = async (req, res) => {
  try {
    const rules = await GracingCondonationRule.find();
    res.status(200).json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};