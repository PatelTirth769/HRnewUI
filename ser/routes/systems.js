const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

const formatDoc = (doc) => ({ _id: doc.id, ...doc.data() });

// GET all systems
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('systems').get();
        const systems = snapshot.docs.map(formatDoc);
        // Basic sort by order then by name
        systems.sort((a, b) => {
            if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
            return (a.name || '').localeCompare(b.name || '');
        });
        res.json(systems);
    } catch (err) {
        console.error('Error fetching systems:', err);
        res.status(500).json({ error: 'Failed to fetch systems' });
    }
});

// POST create a new system
router.post('/', async (req, res) => {
    try {
        const { name, code, erpNextUrl, status, order } = req.body;
        if (!name || !code || !erpNextUrl) {
            return res.status(400).json({ error: 'name, code, and erpNextUrl are required' });
        }
        
        const existing = await db.collection('systems').where('code', '==', code).get();
        if (!existing.empty) {
            return res.status(409).json({ error: 'A system with this code already exists' });
        }

        const docRef = await db.collection('systems').add({ name, code, erpNextUrl, status, order, createdAt: new Date().toISOString() });
        const newDoc = await docRef.get();
        res.status(201).json(formatDoc(newDoc));
    } catch (err) {
        console.error('Error creating system:', err);
        res.status(500).json({ error: 'Failed to create system' });
    }
});

// PUT update a system
router.put('/:id', async (req, res) => {
    try {
        const docRef = db.collection('systems').doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'System not found' });
        
        await docRef.update(req.body);
        const updated = await docRef.get();
        res.json(formatDoc(updated));
    } catch (err) {
        console.error('Error updating system:', err);
        res.status(500).json({ error: 'Failed to update system' });
    }
});

// DELETE a system
router.delete('/:id', async (req, res) => {
    try {
        const docRef = db.collection('systems').doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'System not found' });
        
        await docRef.delete();
        res.json({ message: 'System deleted', system: formatDoc(doc) });
    } catch (err) {
        console.error('Error deleting system:', err);
        res.status(500).json({ error: 'Failed to delete system' });
    }
});

module.exports = router;
