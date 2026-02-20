import React from 'react';

export default function IncomeTaxComputation() {
    const sampleData = [
        { employee: 'HR-EMP-00001', employee_name: 'Rahul Sharma', pan: 'AAAPZ1234C', total_income: 600000, exemptions: 150000, taxable_income: 450000, tax_payable: 10000, cess: 400, total_tax: 10400 },
        { employee: 'HR-EMP-00002', employee_name: 'Priya Patel', pan: 'BBPPS5678D', total_income: 780000, exemptions: 200000, taxable_income: 580000, tax_payable: 23000, cess: 920, total_tax: 23920 },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Income Tax Computation</h1>
                <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">⬇ Export Excel</button>
            </div>

            <div className="flex gap-3 mb-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Payroll Period</label>
                    <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                        <option>FY 2025-26</option>
                        <option>FY 2024-25</option>
                    </select>
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

            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-3 py-3 font-medium text-gray-600">Employee</th>
                            <th className="text-left px-3 py-3 font-medium text-gray-600">Name</th>
                            <th className="text-left px-3 py-3 font-medium text-gray-600">PAN</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">Total Income</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">Exemptions</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">Taxable Income</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">Tax Payable</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">Cess (4%)</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600 bg-red-50">Total Tax</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-3 text-blue-600 cursor-pointer">{row.employee}</td>
                                <td className="px-3 py-3">{row.employee_name}</td>
                                <td className="px-3 py-3 font-mono text-xs">{row.pan}</td>
                                <td className="px-3 py-3 text-right">₹{row.total_income.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right text-green-700">₹{row.exemptions.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right">₹{row.taxable_income.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right">₹{row.tax_payable.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right">₹{row.cess.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right font-semibold text-red-700 bg-red-50">₹{row.total_tax.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
