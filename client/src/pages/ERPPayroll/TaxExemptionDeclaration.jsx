import React from 'react';

export default function TaxExemptionDeclaration() {
    const sampleData = [
        { name: 'DEC-00001', employee: 'HR-EMP-00001', employee_name: 'Rahul Sharma', payroll_period: 'FY 2025-26', company: 'Preeshe Technologies', total_exemption: 150000, docstatus: 'Submitted' },
        { name: 'DEC-00002', employee: 'HR-EMP-00002', employee_name: 'Priya Patel', payroll_period: 'FY 2025-26', company: 'Preeshe Technologies', total_exemption: 200000, docstatus: 'Draft' },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Tax Exemption Declaration</h1>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">+ New Declaration</button>
            </div>

            <div className="flex gap-3 mb-4">
                <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                    <option value="">Payroll Period</option>
                    <option>FY 2025-26</option>
                    <option>FY 2024-25</option>
                </select>
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
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Payroll Period</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-600">Total Exemption</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-blue-600 cursor-pointer">{row.name}</td>
                                <td className="px-4 py-3">{row.employee}</td>
                                <td className="px-4 py-3">{row.employee_name}</td>
                                <td className="px-4 py-3">{row.payroll_period}</td>
                                <td className="px-4 py-3">{row.company}</td>
                                <td className="px-4 py-3 text-right font-medium">₹{row.total_exemption.toLocaleString('en-IN')}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs ${row.docstatus === 'Submitted' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                                        {row.docstatus}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
