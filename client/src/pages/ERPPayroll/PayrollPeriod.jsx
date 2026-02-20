import React from 'react';

export default function PayrollPeriod() {
    const sampleData = [
        { name: 'FY 2025-26', company: 'Preeshe Technologies', start_date: '2025-04-01', end_date: '2026-03-31', status: 'Active' },
        { name: 'FY 2024-25', company: 'Preeshe Technologies', start_date: '2024-04-01', end_date: '2025-03-31', status: 'Closed' },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Payroll Period</h1>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">+ New Payroll Period</button>
            </div>

            <div className="flex gap-3 mb-4">
                <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                    <option value="">Company</option>
                    <option>Preeshe Technologies</option>
                </select>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Period Name</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Start Date</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">End Date</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-blue-600 cursor-pointer">{row.name}</td>
                                <td className="px-4 py-3">{row.company}</td>
                                <td className="px-4 py-3">{row.start_date}</td>
                                <td className="px-4 py-3">{row.end_date}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs ${row.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {row.status}
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
