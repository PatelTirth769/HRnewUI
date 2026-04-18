const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { getCollection } = require('./firebaseHelper');

// GET user role by email/username (Public/Pre-login check)
router.get('/get-role/:identifier', async (req, res) => {
    try {
        const identifier = (req.params.identifier || '').trim();
        if (!identifier) return res.json({ role: null });

        let roleMatch = null;
        let systemMatch = null;

        // Try each system's users collection to find this user
        // First check the shared top-level 'users' collection
        let snapshot = await db.collection('users').where('email', '==', identifier).limit(1).get();
        if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            roleMatch = userData.role;
            systemMatch = userData.system;
        } else {
            // Try by username in shared collection
            snapshot = await db.collection('users').where('username', '==', identifier).limit(1).get();
            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                roleMatch = userData.role;
                systemMatch = userData.system;
            }
        }

        // If not found in shared collection, also check the schooler_system sub-collection
        if (!roleMatch) {
            const schoolerUsersCol = getCollection(db, 'schooler', 'users');
            let schoolerSnap = await schoolerUsersCol.where('email', '==', identifier).limit(1).get();
            if (!schoolerSnap.empty) {
                const userData = schoolerSnap.docs[0].data();
                roleMatch = userData.role;
                systemMatch = userData.system || 'schooler';
            } else {
                schoolerSnap = await schoolerUsersCol.where('username', '==', identifier).limit(1).get();
                if (!schoolerSnap.empty) {
                    const userData = schoolerSnap.docs[0].data();
                    roleMatch = userData.role;
                    systemMatch = userData.system || 'schooler';
                }
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
