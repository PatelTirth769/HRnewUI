const express = require('express');
const axios = require('axios');
const router = express.Router();
const System = require('../models/System');

// In-memory cache for system lookups (refreshed every 5 minutes)
let systemCache = {};
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSystemUrl(code) {
    const now = Date.now();
    if (now - cacheTime > CACHE_TTL || !systemCache[code]) {
        const systems = await System.find({ status: 'active' });
        systemCache = {};
        systems.forEach(s => { systemCache[s.code] = s.erpNextUrl; });
        cacheTime = now;
    }
    return systemCache[code] || null;
}

// Proxy all requests: /erp-proxy/:systemCode/...rest
router.all('/:systemCode/*', async (req, res) => {
    try {
        const { systemCode } = req.params;
        const targetBase = await getSystemUrl(systemCode);

        if (!targetBase) {
            return res.status(404).json({ error: `System "${systemCode}" not found or inactive` });
        }

        // Build the target path (everything after /erp-proxy/:systemCode)
        // req.params[0] captures the wildcard part
        const targetPath = req.params[0];
        const targetUrl = `${targetBase}/${targetPath}`;

        // Forward the request
        const axiosConfig = {
            method: req.method,
            url: targetUrl,
            headers: {
                ...req.headers,
                host: new URL(targetBase).host, // Override host header
            },
            params: req.query,
            timeout: 30000,
            validateStatus: () => true, // Don't throw on non-2xx responses
        };

        // Remove headers that shouldn't be forwarded
        delete axiosConfig.headers['content-length'];
        delete axiosConfig.headers['connection'];

        // Forward body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
            axiosConfig.data = req.body;
        }

        // Forward cookies
        if (req.headers.cookie) {
            axiosConfig.headers.cookie = req.headers.cookie;
        }

        const response = await axios(axiosConfig);

        // Forward response headers (especially Set-Cookie for session)
        const responseHeaders = response.headers;
        if (responseHeaders['set-cookie']) {
            res.setHeader('set-cookie', responseHeaders['set-cookie']);
        }
        if (responseHeaders['content-type']) {
            res.setHeader('content-type', responseHeaders['content-type']);
        }

        res.status(response.status).json(response.data);
    } catch (err) {
        console.error('ERP Proxy Error:', err.message);
        res.status(502).json({ error: 'Proxy error', message: err.message });
    }
});

module.exports = router;
