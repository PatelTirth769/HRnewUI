const express = require('express');
const router = express.Router();

// Dummy data generator for HR Dashboard
router.get('/', async (req, res) => {
    try {
        const dashboardData = {
            stats: {
                totalEmployees: { count: 5, description: "0 % since last month" },
                newHires: { count: 1, description: "" },
                employeeExits: { count: 0, description: "" },
                employeesJoining: { count: 1, description: "" },
                employeesRelieving: { count: 0, description: "" },
                lastSynced: "Just now"
            },
            charts: {
                employeesByAge: {
                    labels: ['15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80+'],
                    counts: [0, 3, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]
                },
                genderDiversity: {
                    labels: ['Male', 'Female'],
                    counts: [4, 1]
                },
                employeesByType: {
                    labels: ['Full-time', 'Part-time'],
                    counts: [3, 2]
                },
                employeesByGrade: {
                    labels: ['Developer', 'MGMT'],
                    counts: [2, 1] // Adding dummy third grade optionally: [2, 1, 2]
                },
                employeesByBranch: {
                    labels: ['Ahmedabad', 'Mumbai'],
                    counts: [3, 2]
                },
                designationWise: {
                    labels: ['Software Developer', 'Business Analyst', 'Chief Executive...', 'Programmer'],
                    counts: [2, 1, 1, 1]
                },
                departmentWise: {
                    labels: ['Operations', 'Management', 'IT'],
                    counts: [2, 1, 2]
                }
            }
        };

        res.json(dashboardData);
    } catch (error) {
        console.error("Error fetching HR Dashboard data:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
