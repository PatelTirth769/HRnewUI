const express = require('express');
const router = express.Router();
const Navigation = require('../models/Navigation');

// GET /api/navigation — return all modules sorted by order
router.get('/', async (req, res) => {
    try {
        const modules = await Navigation.find().sort({ order: 1 }).lean();
        res.json(modules);
    } catch (err) {
        console.error('Error fetching navigation:', err);
        res.status(500).json({ error: 'Failed to fetch navigation' });
    }
});

module.exports = router;
