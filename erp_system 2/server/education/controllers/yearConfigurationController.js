const YearConfiguration = require('../models/YearConfiguration');

// Get all year configurations
exports.getAllYearConfigurations = async (req, res) => {
  try {
    const yearConfigurations = await YearConfiguration.find().sort({ createdAt: -1 });
    res.status(200).json(yearConfigurations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single year configuration
exports.getYearConfigurationById = async (req, res) => {
  try {
    const yearConfiguration = await YearConfiguration.findById(req.params.id);
    if (!yearConfiguration) {
      return res.status(404).json({ message: 'Year configuration not found' });
    }
    res.status(200).json(yearConfiguration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new year configuration
exports.createYearConfiguration = async (req, res) => {
  try {
    const newYearConfiguration = new YearConfiguration(req.body);
    const savedYearConfiguration = await newYearConfiguration.save();
    res.status(201).json(savedYearConfiguration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a year configuration
exports.updateYearConfiguration = async (req, res) => {
  try {
    const updatedYearConfiguration = await YearConfiguration.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedYearConfiguration) {
      return res.status(404).json({ message: 'Year configuration not found' });
    }
    res.status(200).json(updatedYearConfiguration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a year configuration (soft delete)
exports.deleteYearConfiguration = async (req, res) => {
  try {
    const yearConfiguration = await YearConfiguration.findById(req.params.id);
    if (!yearConfiguration) {
      return res.status(404).json({ message: 'Year configuration not found' });
    }
    
    yearConfiguration.isDeleted = true;
    await yearConfiguration.save();
    
    res.status(200).json({ message: 'Year configuration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle active status
exports.toggleActiveStatus = async (req, res) => {
  try {
    const yearConfiguration = await YearConfiguration.findById(req.params.id);
    if (!yearConfiguration) {
      return res.status(404).json({ message: 'Year configuration not found' });
    }
    
    yearConfiguration.active = !yearConfiguration.active;
    await yearConfiguration.save();
    
    res.status(200).json({ 
      message: `Year configuration ${yearConfiguration.active ? 'activated' : 'deactivated'} successfully`,
      active: yearConfiguration.active
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};