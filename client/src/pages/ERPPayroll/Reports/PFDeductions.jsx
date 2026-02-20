import React from 'react';

export default function PFDeductions() {
    const sampleData = [
        { employee: 'HR-EMP-00001', employee_name: 'Rahul Sharma', pf_number: 'MH/12345/67890', basic: 25000, employee_pf: 3000, employer_pf: 3000, total_pf: 6000, month: 'January 2026' },
        { employee: 'HR-EMP-00002', employee_name: 'Priya Patel', pf_number: 'MH/12345/67891', basic: 32500, employee_pf: 3900, employer_pf: 3900, total_pf: 7800, month: 'January 2026' },
        { employee: 'HR-EMP-00003', employee_name: 'Amit Kumar', pf_number: 'MH/12345/67892', basic: 17500, employee_pf: 2100, employer_pf: 2100, total_pf: 4200, month: 'January 2026' },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Provident Fund Deductions</h1>
                <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">⬇ Export Excel</button>
            </div>

            <div className="flex gap-3 mb-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">From Date</label>
                    <input type="date" className="border border-gray-300 rounded px-3 py-2 text-sm" defaultValue="2026-01-01" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">To Date</label>
                    <input type="date" className="border border-gray-300 rounded px-3 py-2 text-sm" defaultValue="2026-01-31" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Company</label>
                    <select className="border border-gray-300 rounded px-3 py-2 text-sm"><option>Preeshe Technologies</option></select>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-3 py-3 font-medium text-gray-600">Employee</th>
                            <th className="text-left px-3 py-3 font-medium text-gray-600">Name</th>
                            <th className="text-left px-3 py-3 font-medium text-gray-600">PF Number</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">Basic</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">Employee PF</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">Employer PF</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600 bg-blue-50">Total PF</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-3">{row.employee}</td>
                                <td className="px-3 py-3">{row.employee_name}</td>
                                <td className="px-3 py-3 font-mono text-xs">{row.pf_number}</td>
                                <td className="px-3 py-3 text-right">₹{row.basic.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right">₹{row.employee_pf.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right">₹{row.employer_pf.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right font-semibold bg-blue-50">₹{row.total_pf.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-100 font-semibold">
                            <td className="px-3 py-3" colSpan={3}>Total</td>
                            <td className="px-3 py-3 text-right">₹{sampleData.reduce((s, r) => s + r.basic, 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-right">₹{sampleData.reduce((s, r) => s + r.employee_pf, 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-right">₹{sampleData.reduce((s, r) => s + r.employer_pf, 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-right bg-blue-50">₹{sampleData.reduce((s, r) => s + r.total_pf, 0).toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
