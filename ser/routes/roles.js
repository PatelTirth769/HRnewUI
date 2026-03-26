const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// Utility to ensure compatibility with frontend expecting MongoDB-like _id
const formatDoc = (doc) => ({ _id: doc.id, ...doc.data() });

// GET all roles
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('roles').get();
        const roles = snapshot.docs.map(formatDoc);
        res.json({ data: roles });
    } catch (err) {
        console.error('Error fetching roles from Firebase:', err);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

// GET single role by name or id
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Try by name first
        const snapshot = await db.collection('roles').where('name', '==', id).limit(1).get();
        if (!snapshot.empty) {
            return res.json({ data: formatDoc(snapshot.docs[0]) });
        }
        
        // Try by ID directly
        const docRef = db.collection('roles').doc(id);
        const doc = await docRef.get();
        if (doc.exists) {
            return res.json({ data: formatDoc(doc) });
        }
        
        res.status(404).json({ error: 'Role not found' });
    } catch (err) {
        console.error('Error fetching role:', err);
        res.status(500).json({ error: 'Failed to fetch role' });
    }
});

// POST create role
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        
        // Check for uniqueness
        const existing = await db.collection('roles').where('name', '==', name).limit(1).get();
        if (!existing.empty) {
            return res.status(409).json({ error: 'A role with this name already exists' });
        }
        
        const docRef = await db.collection('roles').add(req.body);
        const newDoc = await docRef.get();
        res.status(201).json({ data: formatDoc(newDoc) });
    } catch (err) {
        console.error('Error creating role:', err);
        res.status(500).json({ error: 'Failed to create role' });
    }
});

// PUT update role
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let docRef;

        // Find by name first
        const snapshot = await db.collection('roles').where('name', '==', id).limit(1).get();
        if (!snapshot.empty) {
            docRef = snapshot.docs[0].ref;
        } else {
            // Assume ID
            docRef = db.collection('roles').doc(id);
        }

        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Update preserving existing data conceptually, or overwrite fields
        await docRef.update(req.body);
        
        const updatedDoc = await docRef.get();
        res.json({ data: formatDoc(updatedDoc) });
    } catch (err) {
        console.error('Error updating role:', err);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// DELETE role
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let docRef;

        const snapshot = await db.collection('roles').where('name', '==', id).limit(1).get();
        if (!snapshot.empty) {
            docRef = snapshot.docs[0].ref;
        } else {
            docRef = db.collection('roles').doc(id);
        }

        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Role not found' });
        }

        await docRef.delete();
        res.json({ message: 'Role deleted', data: formatDoc(doc) });
    } catch (err) {
        console.error('Error deleting role:', err);
        res.status(500).json({ error: 'Failed to delete role' });
    }
});

module.exports = router;
