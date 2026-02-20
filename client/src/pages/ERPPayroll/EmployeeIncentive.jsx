import React from 'react';

export default function EmployeeIncentive() {
    const sampleData = [
        { name: 'EI-00001', employee: 'HR-EMP-00001', employee_name: 'Rahul Sharma', incentive_type: 'Performance Bonus', amount: 25000, payroll_date: '2026-01-31', docstatus: 'Submitted' },
        { name: 'EI-00002', employee: 'HR-EMP-00002', employee_name: 'Priya Patel', incentive_type: 'Spot Award', amount: 10000, payroll_date: '2026-01-31', docstatus: 'Draft' },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Employee Incentive</h1>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">+ New Employee Incentive</button>
            </div>

            <div className="flex gap-3 mb-4">
                <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                    <option value="">Company</option>
                    <option>Preeshe Technologies</option>
                </select>
                <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                    <option value="">Status</option>
                    <option>Draft</option>
                    <option>Submitted</option>
                </select>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Employee Name</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Incentive Type</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Payroll Date</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-blue-600 cursor-pointer">{row.name}</td>
                                <td className="px-4 py-3">{row.employee}</td>
                                <td className="px-4 py-3">{row.employee_name}</td>
                                <td className="px-4 py-3">{row.incentive_type}</td>
                                <td className="px-4 py-3 text-right font-medium">₹{row.amount.toLocaleString('en-IN')}</td>
                                <td className="px-4 py-3">{row.payroll_date}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs ${row.docstatus === 'Submitted' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                                        {row.docstatus}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <button className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
                                    <button className="text-red-600 hover:underline text-xs">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
