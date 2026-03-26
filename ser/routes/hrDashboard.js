const express = require('express');
const axios = require('axios');
const router = express.Router();
const { db } = require('../firebase');

// Helper to determine age bucket
function getAgeBucket(dob) {
    if (!dob) return "Unknown";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    if (age < 20) return "15-19";
    if (age < 25) return "20-24";
    if (age < 30) return "25-29";
    if (age < 35) return "30-34";
    if (age < 40) return "35-39";
    if (age < 45) return "40-44";
    if (age < 50) return "45-49";
    if (age < 55) return "50-54";
    if (age < 60) return "55-59";
    if (age < 65) return "60-64";
    if (age < 70) return "65-69";
    if (age < 75) return "70-74";
    if (age < 80) return "75-79";
    return "80+";
}

async function getSystemUrl(code) {
    try {
        const snapshot = await db.collection('systems').where('code', '==', code).get();
        if (snapshot.empty) return null;
        return snapshot.docs[0].data().erpNextUrl;
    } catch (err) {
        console.error("Error getting system URL:", err);
        return null;
    }
}

router.get('/', async (req, res) => {
    try {
        const { Company, Status, systemCode = 'preeshe' } = req.query;
        const targetBase = await getSystemUrl(systemCode);

        console.log(`[HR Dashboard] Request received: system=${systemCode}, company=${Company}, status=${Status}`);

        if (!targetBase) {
            console.error(`[HR Dashboard] Target system not found: ${systemCode}`);
            return res.status(404).json({ message: `System "${systemCode}" not found` });
        }

        // Fetch all employees for aggregation
        const fields = ["name", "date_of_birth", "gender", "employment_type", "grade", "branch", "designation", "department", "company", "status", "date_of_joining", "relieving_date"];
        let filters = [];
        if (Status) filters.push(["status", "=", Status]);
        if (Company) filters.push(["company", "=", Company]);

        console.log(`[HR Dashboard] Calling ERPNext: ${targetBase}/api/resource/Employee`);
        console.log(`[HR Dashboard] Filters: ${JSON.stringify(filters)}`);

        const erpResponse = await axios.get(`${targetBase}/api/resource/Employee`, {
            params: {
                fields: JSON.stringify(fields),
                filters: JSON.stringify(filters),
                limit_page_length: 5000 // Use a large number if 'None' is problematic
            },
            headers: {
                Cookie: req.headers.cookie
            }
        });

        const employees = erpResponse.data.data || [];
        console.log(`[HR Dashboard] Successfully fetched ${employees.length} employees`);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentQuarter = Math.floor(currentMonth / 3);

        // Aggregation objects
        const ageBuckets = { 
            '15-19': 0, '20-24': 0, '25-29': 0, '30-34': 0, '35-39': 0, 
            '40-44': 0, '45-49': 0, '50-54': 0, '55-59': 0, '60-64': 0, 
            '65-69': 0, '70-74': 0, '75-79': 0, '80+': 0, 'Unknown': 0 
        };
        const genderDist = {};
        const typeDist = {};
        const gradeDist = {};
        const branchDist = {};
        const designationDist = {};
        const departmentDist = {};

        let newHiresCount = 0;
        let joiningQuarterCount = 0;
        let relievingQuarterCount = 0;
        let exitsYearCount = 0;

        employees.forEach(emp => {
            // Age
            const bucket = getAgeBucket(emp.date_of_birth);
            if (ageBuckets[bucket] !== undefined) {
                ageBuckets[bucket]++;
            } else {
                ageBuckets['Unknown']++;
            }

            // Simple counts with safe fallbacks
            const increment = (obj, key) => { 
                const safeKey = key || 'N/A';
                obj[safeKey] = (obj[safeKey] || 0) + 1; 
            };
            increment(genderDist, emp.gender);
            increment(typeDist, emp.employment_type);
            increment(gradeDist, emp.grade);
            increment(branchDist, emp.branch);
            increment(designationDist, emp.designation);
            increment(departmentDist, emp.department);

            // Stats
            if (emp.date_of_joining) {
                const doj = new Date(emp.date_of_joining);
                if (doj.getFullYear() === currentYear) {
                    newHiresCount++;
                    if (Math.floor(doj.getMonth() / 3) === currentQuarter) joiningQuarterCount++;
                }
            }
            if (emp.relieving_date) {
                const rd = new Date(emp.relieving_date);
                if (rd.getFullYear() === currentYear) {
                    exitsYearCount++;
                    if (Math.floor(rd.getMonth() / 3) === currentQuarter) relievingQuarterCount++;
                }
            }
        });

        // Remove Unknown if empty for cleaner chart
        if (ageBuckets['Unknown'] === 0) delete ageBuckets['Unknown'];

        const dashboardData = {
            stats: {
                totalEmployees: { count: employees.length, description: "Total records for selected filters" },
                newHires: { count: newHiresCount, description: `Hires in ${currentYear}` },
                employeeExits: { count: exitsYearCount, description: `Exits in ${currentYear}` },
                employeesJoining: { count: joiningQuarterCount, description: `Joined in Q${currentQuarter + 1}` },
                employeesRelieving: { count: relievingQuarterCount, description: `Relieving in Q${currentQuarter + 1}` },
                lastSynced: new Date().toLocaleTimeString()
            },
            charts: {
                employeesByAge: {
                    labels: Object.keys(ageBuckets),
                    counts: Object.values(ageBuckets)
                },
                genderDiversity: {
                    labels: Object.keys(genderDist),
                    counts: Object.values(genderDist)
                },
                employeesByType: {
                    labels: Object.keys(typeDist),
                    counts: Object.values(typeDist)
                },
                employeesByGrade: {
                    labels: Object.keys(gradeDist),
                    counts: Object.values(gradeDist)
                },
                employeesByBranch: {
                    labels: Object.keys(branchDist),
                    counts: Object.values(branchDist)
                },
                designationWise: {
                    labels: Object.keys(designationDist),
                    counts: Object.values(designationDist)
                },
                departmentWise: {
                    labels: Object.keys(departmentDist),
                    counts: Object.values(departmentDist)
                }
            }
        };

        console.log(`[HR Dashboard] Returning data for ${employees.length} employees`);
        res.json(dashboardData);
    } catch (error) {
        console.error("Error generating HR Dashboard data:", error.message);
        if (error.response) {
            console.error("ERPNext Error Status:", error.response.status);
            console.error("ERPNext Error Data:", JSON.stringify(error.response.data, null, 2));
        }
        res.status(500).json({ 
            message: "Error fetching dashboard data", 
            detail: error.message,
            erpError: error.response?.data?.message || 'Check server logs'
        });
    }
});

module.exports = router;
