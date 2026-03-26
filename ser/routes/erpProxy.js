const express = require('express');
const axios = require('axios');
const router = express.Router();
const { db } = require('../firebase');

// In-memory cache for system lookups (refreshed every 5 minutes)
let systemCache = {};
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSystemUrl(code) {
    const now = Date.now();
    if (now - cacheTime > CACHE_TTL || !systemCache[code]) {
        try {
            const snapshot = await db.collection('systems').where('status', '==', 'active').get();
            systemCache = {};
            snapshot.forEach(doc => { 
                const data = doc.data();
                if (data.code && data.erpNextUrl) {
                    systemCache[data.code] = data.erpNextUrl; 
                }
            });
            cacheTime = now;
        } catch (err) {
            console.error('Error caching systems from Firebase:', err);
        }
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

        // --- GEOFENCE CHECK-IN INTERCEPTION ---
        const decodedPath = decodeURIComponent(targetPath);
        if (decodedPath === 'api/resource/Employee Checkin' && req.method.toUpperCase() === 'POST') {
             const checkinData = req.body;
             if (checkinData.log_type === 'IN') {
                 try {
                      const empRes = await axios({
                          method: 'GET',
                          url: `${targetBase}/api/resource/Employee/${encodeURIComponent(checkinData.employee)}`,
                          headers: { 'Cookie': req.headers.cookie || '' }
                      });
                      const empData = empRes.data?.data;
                      if (empData) {
                          const deviceFlag = empData.attendance_device_id;
                          if (deviceFlag === 'MOBILE-GPS') {
                              if (!empData.branch) {
                                  return res.status(400).json({ message: "No branch assigned to employee. Cannot verify location." });
                              }
                              const configDoc = await db.collection('attendance_configs').doc(encodeURIComponent(empData.branch)).get();
                              if (!configDoc.exists) {
                                   return res.status(400).json({ message: `GPS Configuration missing for branch ${empData.branch}` });
                              }
                              
                              const branchLoc = configDoc.data();
                              const bLat = parseFloat(branchLoc.latitude);
                              const bLng = parseFloat(branchLoc.longitude);
                              const eLat = parseFloat(checkinData.latitude);
                              const eLng = parseFloat(checkinData.longitude);
                              
                              if (isNaN(bLat) || isNaN(bLng) || isNaN(eLat) || isNaN(eLng)) {
                                  return res.status(400).json({ message: "Missing or invalid GPS coordinates for Geofence." });
                              }
                              
                              const R = 6371e3;
                              const dLat = (eLat - bLat) * Math.PI / 180;
                              const dLon = (eLng - bLng) * Math.PI / 180;
                              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                        Math.cos(bLat * Math.PI / 180) * Math.cos(eLat * Math.PI / 180) *
                                        Math.sin(dLon/2) * Math.sin(dLon/2);
                              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                              const distance = R * c;
                              
                              if (distance > 10) {
                                  return res.status(400).json({ message: `Location rejected: You are ${Math.round(distance)} meters away. Maximum allowed is 10m.` });
                              }
                          } else if (deviceFlag && deviceFlag !== 'MOBILE-GPS') {
                              if (checkinData.device_id === 'ESS Web Portal' || checkinData.latitude !== undefined) {
                                  return res.status(403).json({ message: "You are restricted to physical biometric devices for check-in." });
                              }
                          }
                      }
                 } catch(err) {
                     console.error("Geofence interception error:", err.message);
                     return res.status(500).json({ message: "Error verifying geolocation constraints." });
                 }
             }
        }
        // ------------------------------------

        const response = await axios(axiosConfig);

        // Intercept Login to attach MongoDB Role
        if (targetPath === 'api/method/login' && response.status === 200) {
            console.log(`[Login Intercept] Successful login for user: ${req.body.usr}`);
            const email = req.body.usr;
            if (email) {
                try {
                    let mongoRole = null;
                    let mongoUserExists = false;

                    // Try by email first
                    let snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
                    if (!snapshot.empty) {
                        mongoUserExists = true;
                        mongoRole = snapshot.docs[0].data().role;
                    } else {
                        // Try by username
                        snapshot = await db.collection('users').where('username', '==', email).limit(1).get();
                        if (!snapshot.empty) {
                            mongoUserExists = true;
                            mongoRole = snapshot.docs[0].data().role;
                        }
                    }

                    if (mongoUserExists) {
                        console.log(`[Login Intercept] User found in Firebase. Role: ${mongoRole}`);
                    } else {
                        console.log(`[Login Intercept] User NOT found in Firebase. Attempting auto-sync...`);
                        try {
                            const userRes = await axios({
                                method: 'GET',
                                url: `${targetBase}/api/resource/User/${encodeURIComponent(email)}`,
                                headers: {
                                    'Cookie': response.headers['set-cookie']?.join('; ') || '',
                                }
                            });
                            
                            console.log(`[Login Intercept] ERPNext User Data:`, JSON.stringify(userRes.data, null, 2));
                            const erpRoles = userRes.data?.data?.roles?.map(r => r.role) || [];
                            console.log(`[Login Intercept] ERPNext Roles: ${erpRoles.join(', ')}`);
                            
                            if (erpRoles.includes('Administrator') || erpRoles.includes('System Manager')) {
                                mongoRole = 'Administrator';
                            } else if (erpRoles.includes('HR Manager')) {
                                mongoRole = 'HR Manager';
                            } else if (erpRoles.includes('HR User')) {
                                mongoRole = 'HR User';
                            } else {
                                mongoRole = 'Employee';
                            }

                            // Use email as unique document ID or let Firebase generate one
                            await db.collection('users').add({
                                email: email,
                                username: email, // Use full email for uniqueness
                                role: mongoRole,
                                status: 'active',
                                password: 'linked-to-erpnext',
                                createdAt: new Date().toISOString()
                            });
                            console.log(`[Login Intercept] Auto-Sync Success: Created user ${email} with role ${mongoRole}`);
                        } catch (syncErr) {
                            console.error('[Login Intercept] Auto-Sync Failed:', syncErr.message);
                            if (syncErr.response) {
                                console.error('[Login Intercept] Auto-Sync Error Data:', JSON.stringify(syncErr.response.data, null, 2));
                            }
                        }
                    }

                    if (mongoRole && typeof response.data === 'object') {
                        response.data.mongo_role = mongoRole;
                    }
                } catch (mongoErr) {
                    console.error('Error during login interception:', mongoErr);
                }
            }
        }

        // Forward response headers (especially Set-Cookie for session)
        const responseHeaders = response.headers;
        if (responseHeaders['set-cookie']) {
            res.setHeader('set-cookie', responseHeaders['set-cookie']);
        }
        if (responseHeaders['content-type']) {
            res.setHeader('content-type', responseHeaders['content-type']);
        }

        if (response.status >= 400) {
            console.error(`ERP Proxy [${systemCode}] Error ${response.status} for ${targetUrl}:`, JSON.stringify(response.data, null, 2));
        }

        res.status(response.status).json(response.data);
    } catch (err) {
        console.error('ERP Proxy Error:', err.message);
        res.status(502).json({ error: 'Proxy error', message: err.message });
    }
});


module.exports = router;
