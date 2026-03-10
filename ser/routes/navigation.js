const express = require('express');
const router = express.Router();
const Navigation = require('../models/Navigation');

// @route  GET /api/navigation
// @desc   Get all navigation modules, sorted by order
router.get('/', async (req, res) => {
    try {
        const modules = await Navigation.find({}).sort({ order: 1 }).lean();
        res.json({ success: true, data: modules });
    } catch (err) {
        console.error('GET /api/navigation error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @route  GET /api/navigation/:moduleKey
// @desc   Get a single navigation module by key
router.get('/:moduleKey', async (req, res) => {
    try {
        const module = await Navigation.findOne({ moduleKey: req.params.moduleKey }).lean();
        if (!module) {
            return res.status(404).json({ success: false, error: 'Module not found' });
        }
        res.json({ success: true, data: module });
    } catch (err) {
        console.error('GET /api/navigation/:moduleKey error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @route  POST /api/navigation
// @desc   Create a new navigation module
router.post('/', async (req, res) => {
    try {
        const { moduleKey, title, order, adminOnly, sections } = req.body;
        if (!moduleKey || !title) {
            return res.status(400).json({ success: false, error: 'moduleKey and title are required' });
        }
        const existing = await Navigation.findOne({ moduleKey });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Module with this key already exists' });
        }
        const nav = new Navigation({ moduleKey, title, order: order || 0, adminOnly: adminOnly || false, sections: sections || [] });
        await nav.save();
        res.status(201).json({ success: true, data: nav });
    } catch (err) {
        console.error('POST /api/navigation error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @route  PUT /api/navigation/:moduleKey
// @desc   Update an existing navigation module
router.put('/:moduleKey', async (req, res) => {
    try {
        const updated = await Navigation.findOneAndUpdate(
            { moduleKey: req.params.moduleKey },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!updated) {
            return res.status(404).json({ success: false, error: 'Module not found' });
        }
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/navigation/:moduleKey error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @route  DELETE /api/navigation/:moduleKey
// @desc   Delete a navigation module
router.delete('/:moduleKey', async (req, res) => {
    try {
        const deleted = await Navigation.findOneAndDelete({ moduleKey: req.params.moduleKey });
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Module not found' });
        }
        res.json({ success: true, message: 'Module deleted' });
    } catch (err) {
        console.error('DELETE /api/navigation/:moduleKey error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
