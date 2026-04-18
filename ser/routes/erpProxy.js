const express = require('express');
const axios = require('axios');
const router = express.Router();
const { db } = require('../firebase');
const { getCollection, isSchooler } = require('./firebaseHelper');

async function getSystemUrl(code) {
    return process.env.SCHOOLER_ERP_URL || 'https://3iinfotech.hrhovercraft.in';
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
                              // Use system-aware collection for attendance_configs
                              const attendanceCol = getCollection(db, systemCode, 'attendance_configs');
                              const configDoc = await attendanceCol.doc(encodeURIComponent(empData.branch)).get();
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

                    // Use system-aware collection for users
                    const usersCol = getCollection(db, systemCode, 'users');

                    // Try by email first
                    let snapshot = await usersCol.where('email', '==', email).limit(1).get();
                    if (!snapshot.empty) {
                        mongoUserExists = true;
                        mongoRole = snapshot.docs[0].data().role;
                    } else {
                        // Try by username
                        snapshot = await usersCol.where('username', '==', email).limit(1).get();
                        if (!snapshot.empty) {
                            mongoUserExists = true;
                            mongoRole = snapshot.docs[0].data().role;
                        }
                    }

                    console.log(`[Login Intercept] Attempting to sync roles from ERPNext...`);
                    try {
                        const userRes = await axios({
                            method: 'GET',
                            url: `${targetBase}/api/resource/User/${encodeURIComponent(email)}`,
                            headers: {
                                'Cookie': response.headers['set-cookie']?.join('; ') || '',
                            }
                        });
                        
                        console.log(`[Login Intercept] ERPNext User Data fetched.`);
                        let erpRoles = userRes.data?.data?.roles?.map(r => r.role) || [];
                        
                        // Fallback 1: Try get_roles RPC if array is empty
                        if (erpRoles.length === 0) {
                            try {
                                const rolesRpc = await axios({
                                    method: 'GET',
                                    url: `${targetBase}/api/method/frappe.core.doctype.user.user.get_roles`,
                                    headers: { 'Cookie': response.headers['set-cookie']?.join('; ') || '' }
                                });
                                if (rolesRpc.data?.message && Array.isArray(rolesRpc.data.message)) {
                                    erpRoles = rolesRpc.data.message;
                                    console.log(`[Login Intercept] RPC get_roles returned: ${erpRoles.join(', ')}`);
                                }
                            } catch (rpcErr) {
                                console.log('[Login Intercept] get_roles RPC failed or unauthorized');
                            }
                        }

                        // Fallback 2: Check module_profile or Role Profile
                        const moduleProfile = userRes.data?.data?.module_profile;
                        const roleProfileName = userRes.data?.data?.role_profile_name || userRes.data?.data?.role_profile;
                        
                        console.log(`[Login Intercept] Final ERPNext Roles: ${erpRoles.join(', ')} | Profile: ${moduleProfile} | Role Profile: ${roleProfileName}`);
                        
                        // Debugging snippet: log keys relating to roles/profiles just in case
                        const roleKeys = Object.keys(userRes.data?.data || {}).filter(k => k.includes('role') || k.includes('profile'));
                        try {
                            require('fs').writeFileSync('debug_login_response.json', JSON.stringify({
                                roleKeys,
                                roleProfileName,
                                moduleProfile,
                                email
                            }, null, 2));
                        } catch(e) {}

                        // Determine if we got any meaningful data from ERPNext
                        const gotMeaningfulData = erpRoles.length > 0 || (moduleProfile && moduleProfile !== 'Employee' && moduleProfile !== '') || roleProfileName;
                        
                        let updatedRole = null;
                        
                        // Priority 1: Direct Role Profile assignment (e.g. CEO)
                        if (roleProfileName) {
                            updatedRole = roleProfileName;
                        } 
                        // Priority 2: Hardcoded mappings
                        else if (erpRoles.includes('Administrator') || erpRoles.includes('System Manager')) {
                            updatedRole = 'Administrator';
                        } else if (erpRoles.includes('HR Manager') || erpRoles.includes('HR') || moduleProfile === 'HR') {
                            updatedRole = 'HR Manager';
                        } else if (erpRoles.includes('HR User')) {
                            updatedRole = 'HR User'; 
                        } else if (erpRoles.includes('Inventory') || erpRoles.includes('Stock User') || erpRoles.includes('Stock Manager') || moduleProfile === 'Inventory') {
                            updatedRole = 'Inventory';
                        } else if (erpRoles.includes('Accounts User') || erpRoles.includes('Accounts Manager') || erpRoles.includes('Accounts') || moduleProfile === 'Accounts') {
                            updatedRole = 'Accounts';
                        } else if (gotMeaningfulData) {
                            // Only default to Employee if we actually got real data from ERPNext
                            updatedRole = 'Employee';
                        }
                        // If updatedRole is still null, we got no useful data — preserve existing Firebase role

                        if (mongoUserExists) {
                            if (updatedRole && updatedRole !== mongoRole) {
                                console.log(`[Login Intercept] Role mismatch. Existing: ${mongoRole}, New: ${updatedRole}. Updating Firebase...`);
                                const querySnapshot = await usersCol.where('email', '==', email).limit(1).get();
                                if (!querySnapshot.empty) {
                                    await usersCol.doc(querySnapshot.docs[0].id).update({ 
                                        role: updatedRole,
                                        system: systemCode 
                                    });
                                    mongoRole = updatedRole;
                                    console.log(`[Login Intercept] Firebase updated successfully to ${updatedRole} (System: ${systemCode})`);
                                }
                            } else if (!updatedRole) {
                                console.log(`[Login Intercept] No meaningful role data from ERPNext. Preserving existing Firebase role: ${mongoRole}`);
                            } else {
                                console.log(`[Login Intercept] Roles match (${mongoRole}). No update needed.`);
                            }
                        } else {
                            // New user: if we couldn't detect a role, default to Employee
                            const roleToCreate = updatedRole || 'Employee';
                            console.log(`[Login Intercept] User NOT found in Firebase. Creating with role ${roleToCreate}...`);
                            await usersCol.add({
                                email: email,
                                username: email,
                                role: roleToCreate,
                                system: systemCode,
                                status: 'active',
                                password: 'linked-to-erpnext',
                                createdAt: new Date().toISOString()
                            });
                            mongoRole = roleToCreate;
                            console.log(`[Login Intercept] Created user ${email} with role ${roleToCreate}`);
                        }
                    } catch (syncErr) {
                        console.error('[Login Intercept] Role Sync Failed:', syncErr.message);
                        if (syncErr.response) {
                            console.error('[Login Intercept] Role Sync Error Data:', JSON.stringify(syncErr.response.data, null, 2));
                        }
                        if (mongoUserExists) {
                            console.log(`[Login Intercept] Fallback: Using existing Firebase role: ${mongoRole}`);
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
