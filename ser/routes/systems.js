const express = require('express');
const router = express.Router();
const System = require('../models/System');

// GET all systems
router.get('/', async (req, res) => {
    try {
        const systems = await System.find().sort({ order: 1, name: 1 });
        res.json(systems);
    } catch (err) {
        console.error('Error fetching systems:', err);
        res.status(500).json({ error: 'Failed to fetch systems' });
    }
});

// POST create a new system
router.post('/', async (req, res) => {
    try {
        const { name, code, erpNextUrl, status, order } = req.body;
        if (!name || !code || !erpNextUrl) {
            return res.status(400).json({ error: 'name, code, and erpNextUrl are required' });
        }
        const system = await System.create({ name, code, erpNextUrl, status, order });
        res.status(201).json(system);
    } catch (err) {
        console.error('Error creating system:', err);
        if (err.code === 11000) {
            return res.status(409).json({ error: 'A system with this code already exists' });
        }
        res.status(500).json({ error: 'Failed to create system' });
    }
});

// PUT update a system
router.put('/:id', async (req, res) => {
    try {
        const updated = await System.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'System not found' });
        res.json(updated);
    } catch (err) {
        console.error('Error updating system:', err);
        res.status(500).json({ error: 'Failed to update system' });
    }
});

// DELETE a system
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await System.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'System not found' });
        res.json({ message: 'System deleted', system: deleted });
    } catch (err) {
        console.error('Error deleting system:', err);
        res.status(500).json({ error: 'Failed to delete system' });
    }
});

module.exports = router;
