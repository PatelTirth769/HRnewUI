import React from 'react';

export default function PTDeductions() {
    const sampleData = [
        { employee: 'HR-EMP-00001', employee_name: 'Rahul Sharma', state: 'Maharashtra', gross_salary: 50000, pt_amount: 200, month: 'January 2026' },
        { employee: 'HR-EMP-00002', employee_name: 'Priya Patel', state: 'Maharashtra', gross_salary: 65000, pt_amount: 200, month: 'January 2026' },
        { employee: 'HR-EMP-00003', employee_name: 'Amit Kumar', state: 'Karnataka', gross_salary: 35000, pt_amount: 150, month: 'January 2026' },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Professional Tax Deductions</h1>
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
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">State</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-600">Gross Salary</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-600">PT Amount</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Month</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">{row.employee}</td>
                                <td className="px-4 py-3">{row.employee_name}</td>
                                <td className="px-4 py-3">{row.state}</td>
                                <td className="px-4 py-3 text-right">₹{row.gross_salary.toLocaleString('en-IN')}</td>
                                <td className="px-4 py-3 text-right font-medium text-red-600">₹{row.pt_amount.toLocaleString('en-IN')}</td>
                                <td className="px-4 py-3">{row.month}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-100 font-semibold">
                            <td className="px-4 py-3" colSpan={3}>Total</td>
                            <td className="px-4 py-3 text-right">₹{sampleData.reduce((s, r) => s + r.gross_salary, 0).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-right text-red-600">₹{sampleData.reduce((s, r) => s + r.pt_amount, 0).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
