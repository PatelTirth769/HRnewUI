const Program = require('../models/Program');

// सभी प्रोग्राम्स प्राप्त करें
exports.getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.find();
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// नया प्रोग्राम बनाएं
exports.createProgram = async (req, res) => {
  try {
    const program = new Program(req.body);
    const savedProgram = await program.save();
    res.status(201).json(savedProgram);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// प्रोग्राम को ID से प्राप्त करें
exports.getProgramById = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.status(200).json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// प्रोग्राम को अपडेट करें
exports.updateProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.status(200).json(program);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// प्रोग्राम को हटाएं
exports.deleteProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndDelete(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.status(200).json({ message: 'Program deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};