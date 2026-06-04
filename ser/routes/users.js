const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { getCollection } = require('./firebaseHelper');

// GET user role by email/username (Public/Pre-login check)
router.get('/get-role/:identifier', async (req, res) => {
    try {
        const identifier = (req.params.identifier || '').trim();
        if (!identifier) return res.json({ role: null });

        const accounts = [];
        const seenEmails = new Set();

        const addAccountsFromSnapshot = (snap) => {
            if (!snap.empty) {
                snap.forEach(doc => {
                    const data = doc.data();
                    const key = data.email || data.username || data.mobile_no || doc.id;
                    if (!seenEmails.has(key)) {
                        seenEmails.add(key);
                        accounts.push({
                            role: data.role,
                            system: data.system || 'schooler',
                            email: data.email || data.username || identifier
                        });
                    }
                });
            }
        };

        // Try each system's users collection to find this user
        // First check the shared top-level 'users' collection
        let snapshot = await db.collection('users').where('email', '==', identifier).get();
        addAccountsFromSnapshot(snapshot);
        
        if (accounts.length === 0) {
            snapshot = await db.collection('users').where('username', '==', identifier).get();
            addAccountsFromSnapshot(snapshot);
        }
        if (accounts.length === 0) {
            snapshot = await db.collection('users').where('mobile_no', '==', identifier).get();
            addAccountsFromSnapshot(snapshot);
        }

        // If not found in shared collection, also check the schooler_system sub-collection
        if (accounts.length === 0) {
            const schoolerUsersCol = getCollection(db, 'schooler', 'users');
            let schoolerSnap = await schoolerUsersCol.where('email', '==', identifier).get();
            addAccountsFromSnapshot(schoolerSnap);
            
            if (accounts.length === 0) {
                schoolerSnap = await schoolerUsersCol.where('username', '==', identifier).get();
                addAccountsFromSnapshot(schoolerSnap);
            }
            if (accounts.length === 0) {
                schoolerSnap = await schoolerUsersCol.where('mobile_no', '==', identifier).get();
                addAccountsFromSnapshot(schoolerSnap);
            }
        }

        // ALWAYS check the registrations collection to eagerly load ALL accounts before their first login
        // This ensures if one account (e.g. Student) has logged in but Guardian hasn't, we still find the Guardian
        const registrationsCol = db.collection('schooler_system').doc('enquiry_management').collection('registrations');
        
        // Look for Student matches by mobile
        const regSnap = await registrationsCol.where('student_mobile_number', '==', identifier).get();
        if (!regSnap.empty) {
            regSnap.forEach(doc => {
                const data = doc.data();
                if (data.student_email_id && !seenEmails.has(data.student_email_id)) {
                    accounts.push({
                        role: 'Student',
                        system: 'schooler',
                        email: data.student_email_id
                    });
                    seenEmails.add(data.student_email_id);
                }
                // Also eagerly check if any guardian in this document shares the same mobile number
                if (Array.isArray(data.guardians)) {
                    data.guardians.forEach(g => {
                        if (g.mobile_number === identifier && g.email_address) {
                            if (!seenEmails.has(g.email_address)) {
                                accounts.push({
                                    role: 'Guardian',
                                    system: 'schooler',
                                    email: g.email_address
                                });
                                seenEmails.add(g.email_address);
                            }
                        }
                    });
                }
            });
        }

        if (accounts.length === 0) {
            return res.json({ role: null, system: null, accounts: [] });
        }

        res.json({ 
            role: accounts[0].role, 
            system: accounts[0].system,
            accounts: accounts
        });
    } catch (err) {
        console.error('Error fetching role for login from Firebase:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
