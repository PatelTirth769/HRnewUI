const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { getCollection } = require('./firebaseHelper');

// Get coordinate for a specific branch
router.get('/:branchName', async (req, res) => {
    try {
        const branchName = req.params.branchName;
        const systemCode = req.query.system || null;
        const configCol = getCollection(db, systemCode, 'attendance_configs');
        // Use uniform encoding to avoid issues with spaces/symbols
        const docRef = configCol.doc(encodeURIComponent(branchName));
        const doc = await docRef.get();
        if (doc.exists) {
            return res.status(200).json({ data: doc.data() });
        } else {
            return res.status(404).json({ error: 'Config not found' });
        }
    } catch (err) {
        console.error('Error fetching attendance config:', err);
        return res.status(500).json({ error: 'Failed to fetch config' });
    }
});

// Save coordinates for a branch
router.post('/', async (req, res) => {
    try {
        const { branchName, latitude, longitude, system } = req.body;
        if (!branchName) {
            return res.status(400).json({ error: 'Branch name is required' });
        }

        const systemCode = system || req.query.system || null;
        const configCol = getCollection(db, systemCode, 'attendance_configs');
        const docRef = configCol.doc(encodeURIComponent(branchName));
        await docRef.set({
            latitude,
            longitude,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return res.status(200).json({ message: 'Config saved successfully' });
    } catch (err) {
        console.error('Error saving attendance config:', err);
        return res.status(500).json({ error: 'Failed to save config' });
    }
});

module.exports = router;
