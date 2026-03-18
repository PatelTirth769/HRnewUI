const axios = require('axios');

async function testReport() {
    try {
        const payload = {
            report_name: "Employees working on a holiday",
            filters: {
                from_date: "2026-01-01",
                to_date: "2026-12-31",
                company: "Preeshee Consultancy Services"
            }
        };
        
        // Using the proxy (assuming it's running on 5173 or 3001)
        // I'll try to hit the backend directly if possible, or just the proxy
        const res = await axios.post('http://localhost:5173/local-api/erp-proxy/preeshe/api/method/frappe.desk.query_report.run', payload, {
            headers: {
                'Authorization': 'token d12fd0128cb5f98:f62b66ca6b12aa3' // Using a token from a previous session if available, but I don't have one here.
            }
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testReport();
