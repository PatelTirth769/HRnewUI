const express = require('express');
const axios = require('axios');
const router = express.Router();
const { db } = require('../firebase');

/**
 * GET /employee-by-user/:email
 * 
 * Fetches the Employee record for the given user email using admin API credentials.
 * This is a fallback for users whose ERPNext roles (e.g. Inventory, Accounts)
 * don't have direct read permission on the Employee doctype.
 */
router.get('/employee-by-user/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        const apiKey = process.env.ERP_ADMIN_API_KEY;
        const apiSecret = process.env.ERP_ADMIN_API_SECRET;

        if (!apiKey || !apiSecret) {
            return res.status(500).json({ error: 'Admin API credentials not configured' });
        }

        // Get the active system URL from the request header or use first active system
        let systemCode = req.headers['x-system-code'] || null;
        let targetBase = null;

        if (systemCode) {
            // Look up the system URL from Firebase
            const snapshot = await db.collection('systems').where('code', '==', systemCode).where('status', '==', 'active').limit(1).get();
            if (!snapshot.empty) {
                targetBase = snapshot.docs[0].data().erpNextUrl;
            }
        }

        if (!targetBase) {
            // Fallback: use first active system
            const snapshot = await db.collection('systems').where('status', '==', 'active').limit(1).get();
            if (!snapshot.empty) {
                targetBase = snapshot.docs[0].data().erpNextUrl;
            }
        }

        if (!targetBase) {
            return res.status(404).json({ error: 'No active ERP system found' });
        }

        const authToken = `token ${apiKey}:${apiSecret}`;

        // Step 1: Find the Employee by user_id (email)
        const empListRes = await axios.get(`${targetBase}/api/resource/Employee`, {
            params: {
                fields: '["name"]',
                filters: JSON.stringify([["user_id", "=", email]]),
                limit_page_length: 1
            },
            headers: { 'Authorization': authToken },
            timeout: 15000
        });

        const empId = empListRes.data?.data?.[0]?.name;
        if (!empId) {
            // Try by company_email as a fallback
            const empListRes2 = await axios.get(`${targetBase}/api/resource/Employee`, {
                params: {
                    fields: '["name"]',
                    filters: JSON.stringify([["company_email", "=", email]]),
                    limit_page_length: 1
                },
                headers: { 'Authorization': authToken },
                timeout: 15000
            });
            const empId2 = empListRes2.data?.data?.[0]?.name;
            if (!empId2) {
                return res.status(404).json({ error: 'No Employee record found for this user' });
            }
            // Fetch full document
            const empDocRes = await axios.get(`${targetBase}/api/resource/Employee/${encodeURIComponent(empId2)}`, {
                headers: { 'Authorization': authToken },
                timeout: 15000
            });
            return res.json(empDocRes.data?.data || null);
        }

        // Step 2: Fetch full Employee document
        const empDocRes = await axios.get(`${targetBase}/api/resource/Employee/${encodeURIComponent(empId)}`, {
            headers: { 'Authorization': authToken },
            timeout: 15000
        });

        res.json(empDocRes.data?.data || null);
    } catch (err) {
        console.error('[employee-by-user] Error:', err.message);
        if (err.response) {
            console.error('[employee-by-user] Response:', err.response.status, JSON.stringify(err.response.data));
        }
        res.status(err.response?.status || 500).json({ 
            error: 'Failed to fetch employee data', 
            message: err.message 
        });
    }
});

module.exports = router;
