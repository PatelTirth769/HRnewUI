import React from 'react';

export default function IncomeTaxDeductions() {
    const sampleData = [
        { employee: 'HR-EMP-00001', employee_name: 'Rahul Sharma', pan: 'AAAPZ1234C', section: '192', tds_deducted: 870, month: 'January 2026', cumulative_tds: 8700 },
        { employee: 'HR-EMP-00002', employee_name: 'Priya Patel', pan: 'BBPPS5678D', section: '192', tds_deducted: 1993, month: 'January 2026', cumulative_tds: 19930 },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Income Tax Deductions</h1>
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
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Employee</label>
                    <select className="border border-gray-300 rounded px-3 py-2 text-sm"><option value="">All</option></select>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">PAN</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Section</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-600">TDS Deducted</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Month</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-600 bg-red-50">Cumulative TDS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">{row.employee}</td>
                                <td className="px-4 py-3">{row.employee_name}</td>
                                <td className="px-4 py-3 font-mono text-xs">{row.pan}</td>
                                <td className="px-4 py-3">{row.section}</td>
                                <td className="px-4 py-3 text-right text-red-600">₹{row.tds_deducted.toLocaleString('en-IN')}</td>
                                <td className="px-4 py-3">{row.month}</td>
                                <td className="px-4 py-3 text-right font-semibold text-red-700 bg-red-50">₹{row.cumulative_tds.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-100 font-semibold">
                            <td className="px-4 py-3" colSpan={4}>Total</td>
                            <td className="px-4 py-3 text-right text-red-600">₹{sampleData.reduce((s, r) => s + r.tds_deducted, 0).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 text-right text-red-700 bg-red-50">₹{sampleData.reduce((s, r) => s + r.cumulative_tds, 0).toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
