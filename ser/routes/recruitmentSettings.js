const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { getCollection } = require('./firebaseHelper');

// Utility to get or create settings
async function getSettings(systemCode) {
    const settingsCol = getCollection(db, systemCode, 'recruitmentsettings');
    const docRef = settingsCol.doc('singleton');
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
        const systemCode = req.query.system || null;
        const settings = await getSettings(systemCode);
        res.json(settings);
    } catch (err) {
        console.error('Error fetching recruitment settings:', err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT /recruitment-settings — update settings
router.put('/', async (req, res) => {
    try {
        const systemCode = req.query.system || null;
        const settingsCol = getCollection(db, systemCode, 'recruitmentsettings');
        const docRef = settingsCol.doc('singleton');
        const settings = await getSettings(systemCode);
        
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
