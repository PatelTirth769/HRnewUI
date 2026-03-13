const express = require('express');
const router = express.Router();
const RecruitmentSetting = require('../models/RecruitmentSetting');

// GET /recruitment-settings — fetch current settings
router.get('/', async (req, res) => {
    try {
        const settings = await RecruitmentSetting.getSettings();
        res.json(settings);
    } catch (err) {
        console.error('Error fetching recruitment settings:', err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT /recruitment-settings — update settings
router.put('/', async (req, res) => {
    try {
        const settings = await RecruitmentSetting.getSettings();
        if (req.body.enforceStaffPlanning !== undefined) {
            settings.enforceStaffPlanning = req.body.enforceStaffPlanning;
        }
        await settings.save();
        res.json(settings);
    } catch (err) {
        console.error('Error saving recruitment settings:', err);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

module.exports = router;
