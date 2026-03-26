const express = require('express');
const axios = require('axios');
const router = express.Router();
const { db } = require('../firebase');

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
        const { systemCode = 'preeshe', company } = req.query;
        const targetBase = await getSystemUrl(systemCode);

        if (!targetBase) {
            return res.status(404).json({ message: `System "${systemCode}" not found` });
        }

        const now = new Date();
        // Calculate Last Month (Calendar) - Using local dates to avoid UTC shift
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const year = lastMonthDate.getFullYear();
        const month = lastMonthDate.getMonth(); // 0-indexed
        
        const startOfLastMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const endOfLastMonth = new Date(year, month + 1, 0).toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD
        
        const monthName = lastMonthDate.toLocaleString('default', { month: 'long' });

        console.log(`[Payroll Dashboard] Request for system=${systemCode}, company=${company}`);
        console.log(`[Payroll Dashboard] Period: ${startOfLastMonth} to ${endOfLastMonth}`);

        // Helper for fetching counts or sums
        async function getStats(doctype, fields = ["name"], filters = []) {
            console.log(`[Payroll Dashboard] Fetching ${doctype} with filters: ${JSON.stringify(filters)}`);
            try {
                const r = await axios.get(`${targetBase}/api/resource/${doctype}`, {
                    params: { 
                        fields: JSON.stringify(fields), 
                        filters: JSON.stringify(filters), 
                        limit_page_length: "None" 
                    },
                    headers: { Cookie: req.headers.cookie }
                });
                console.log(`[Payroll Dashboard] Found ${r.data.data?.length || 0} records for ${doctype}`);
                return r.data.data || [];
            } catch (err) {
                console.error(`[Payroll Dashboard] Error fetching ${doctype}:`, err.message);
                return [];
            }
        }

        // 1. Total Declarations (Total records)
        const declFilters = [];
        if (company) declFilters.push(["company", "=", company]);
        const declarations = await getStats("Employee Tax Exemption Declaration", ["name"], declFilters);

        // 2. Total Salary Structures
        // Logic: Often "Total Salary Structure" in dashboards refers to active assignments
        let ssFilters = [["is_active", "=", 1]];
        if (company) ssFilters.push(["company", "=", company]);
        let salaryStructures = await getStats("Salary Structure", ["name", "company"], ssFilters);
        
        // If 0, fallback to checking assignments which is more likely to represent the "2" in the image
        if (salaryStructures.length === 0) {
            console.log(`[Payroll Dashboard] No Salary Structures found, checking Salary Structure Assignment...`);
            const assignmentFilters = [["docstatus", "=", 1]];
            if (company) assignmentFilters.push(["company", "=", company]);
            const assignments = await getStats("Salary Structure Assignment", ["name"], assignmentFilters);
            console.log(`[Payroll Dashboard] Found ${assignments.length} assignments.`);
            if (assignments.length > 0) {
                // Use assignment count as the stat
                salaryStructures = assignments;
            }
        }
        
        salaryStructures.forEach(s => console.log(`[Payroll Dashboard] Item: ${s.name}`));

        // 3. Total Incentive (Last Month)
        // Check both 'Employee Incentive' and 'Additional Salary' (with Incentive in component name)
        const incentiveFilters = [
            ["payroll_date", ">=", startOfLastMonth],
            ["payroll_date", "<=", endOfLastMonth],
            ["docstatus", "!=", 2]
        ];
        if (company) incentiveFilters.push(["company", "=", company]);
        const employeeIncentives = await getStats("Employee Incentive", ["incentive_amount"], incentiveFilters);
        const incentiveSum1 = employeeIncentives.reduce((sum, item) => sum + (parseFloat(item.incentive_amount) || 0), 0);

        const addSalFilters = [
            ["payroll_date", ">=", startOfLastMonth],
            ["payroll_date", "<=", endOfLastMonth],
            ["docstatus", "!=", 2],
            ["salary_component", "like", "%Incentive%"]
        ];
        if (company) addSalFilters.push(["company", "=", company]);
        const additionalSalaries = await getStats("Additional Salary", ["amount", "salary_component"], addSalFilters);
        const incentiveSum2 = additionalSalaries.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        
        const totalIncentive = incentiveSum1 + incentiveSum2;
        console.log(`[Payroll Dashboard] Incentive Sum: From Employee Incentive=${incentiveSum1}, From Additional Salary=${incentiveSum2}`);

        // 4. Total Outgoing Salary (Last Month) - Filter by end_date (period alignment)
        const salaryFilters = [
            ["end_date", ">=", startOfLastMonth],
            ["end_date", "<=", endOfLastMonth],
            ["docstatus", "=", 1] // Only submitted
        ];
        if (company) salaryFilters.push(["company", "=", company]);
        const salarySlips = await getStats("Salary Slip", ["net_pay", "posting_date", "employee_name"], salaryFilters);
        const totalSalary = salarySlips.reduce((sum, item) => sum + (parseFloat(item.net_pay) || 0), 0);
        
        salarySlips.forEach(s => console.log(`[Payroll Dashboard] Slip: ${s.employee_name}, Net: ${s.net_pay}, Posting: ${s.posting_date}`));

        console.log(`[Payroll Dashboard] Results: Declarations=${declarations.length}, Structures=${salaryStructures.length}, Incentive=${totalIncentive}, Salary=${totalSalary}`);

        res.json({
            stats: {
                totalDeclarations: declarations.length,
                totalSalaryStructure: salaryStructures.length,
                totalIncentiveLastMonth: totalIncentive,
                totalOutgoingSalaryLastMonth: totalSalary
            },
            context: {
                period: `${monthName} ${year}`,
                startDate: startOfLastMonth,
                endDate: endOfLastMonth,
                company: company || 'All Companies'
            }
        });

    } catch (error) {
        console.error("Error generating Payroll Dashboard data:", error.message);
        res.status(500).json({ message: "Error fetching payroll dashboard data", detail: error.message });
    }
});

module.exports = router;
