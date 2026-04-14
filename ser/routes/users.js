const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// GET user role by email/username (Public/Pre-login check)
router.get('/get-role/:identifier', async (req, res) => {
    try {
        const identifier = (req.params.identifier || '').trim();
        if (!identifier) return res.json({ role: null });

        let roleMatch = null;
        let systemMatch = null;

        // Try to find the user by email first
        let snapshot = await db.collection('users').where('email', '==', identifier).limit(1).get();
        if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            roleMatch = userData.role;
            systemMatch = userData.system;
        } else {
            // Try to find by username
            snapshot = await db.collection('users').where('username', '==', identifier).limit(1).get();
            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                roleMatch = userData.role;
                systemMatch = userData.system;
            }
        }

        if (!roleMatch) {
            return res.json({ role: null, system: null });
        }
        res.json({ role: roleMatch, system: systemMatch });
    } catch (err) {
        console.error('Error fetching role for login from Firebase:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
