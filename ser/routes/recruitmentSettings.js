const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// Utility to get or create settings
async function getSettings() {
    const docRef = db.collection('recruitmentsettings').doc('singleton');
    const doc = await docRef.get();
    
    if (doc.exists) {
        return doc.data();
    } else {
        const defaultSettings = { enforceStaffPlanning: false };
        await docRef.set(defaultSettings);
        return defaultSettings;
    }
}

// GET /recruitment-settings — fetch current settings
router.get('/', async (req, res) => {
    try {
        const settings = await getSettings();
        res.json(settings);
    } catch (err) {
        console.error('Error fetching recruitment settings:', err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT /recruitment-settings — update settings
router.put('/', async (req, res) => {
    try {
        const docRef = db.collection('recruitmentsettings').doc('singleton');
        const settings = await getSettings();
        
        let updatedSettings = { ...settings };
        if (req.body.enforceStaffPlanning !== undefined) {
            updatedSettings.enforceStaffPlanning = req.body.enforceStaffPlanning;
        }
        
        await docRef.set(updatedSettings);
        res.json(updatedSettings);
    } catch (err) {
        console.error('Error saving recruitment settings:', err);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

module.exports = router;
