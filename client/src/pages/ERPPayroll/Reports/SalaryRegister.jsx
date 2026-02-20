import React from 'react';

export default function SalaryRegister() {
    const sampleData = [
        { employee: 'HR-EMP-00001', employee_name: 'Rahul Sharma', department: 'Engineering', basic: 25000, hra: 12500, da: 5000, gross: 50000, pf: 3000, pt: 200, esi: 0, net: 46800 },
        { employee: 'HR-EMP-00002', employee_name: 'Priya Patel', department: 'HR', basic: 32500, hra: 16250, da: 6500, gross: 65000, pf: 3900, pt: 200, esi: 0, net: 60900 },
        { employee: 'HR-EMP-00003', employee_name: 'Amit Kumar', department: 'Operations', basic: 17500, hra: 8750, da: 3500, gross: 35000, pf: 2100, pt: 150, esi: 0, net: 32750 },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Salary Register</h1>
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
                    <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                        <option>Preeshe Technologies</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Department</label>
                    <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                        <option value="">All</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-3 py-3 font-medium text-gray-600">Employee</th>
                            <th className="text-left px-3 py-3 font-medium text-gray-600">Name</th>
                            <th className="text-left px-3 py-3 font-medium text-gray-600">Dept</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">Basic</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">HRA</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">DA</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600 bg-green-50">Gross</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">PF</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">PT</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600">ESI</th>
                            <th className="text-right px-3 py-3 font-medium text-gray-600 bg-blue-50">Net Pay</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-3 text-blue-600 cursor-pointer">{row.employee}</td>
                                <td className="px-3 py-3">{row.employee_name}</td>
                                <td className="px-3 py-3">{row.department}</td>
                                <td className="px-3 py-3 text-right">₹{row.basic.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right">₹{row.hra.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right">₹{row.da.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right font-medium bg-green-50">₹{row.gross.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right text-red-600">₹{row.pf.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right text-red-600">₹{row.pt.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right text-red-600">₹{row.esi.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right font-semibold text-green-700 bg-blue-50">₹{row.net.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-100 font-semibold">
                            <td className="px-3 py-3" colSpan={3}>Total</td>
                            <td className="px-3 py-3 text-right">₹{sampleData.reduce((s, r) => s + r.basic, 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-right">₹{sampleData.reduce((s, r) => s + r.hra, 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-right">₹{sampleData.reduce((s, r) => s + r.da, 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-right bg-green-50">₹{sampleData.reduce((s, r) => s + r.gross, 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-right text-red-600">₹{sampleData.reduce((s, r) => s + r.pf, 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-right text-red-600">₹{sampleData.reduce((s, r) => s + r.pt, 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-right text-red-600">₹{sampleData.reduce((s, r) => s + r.esi, 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-right text-green-700 bg-blue-50">₹{sampleData.reduce((s, r) => s + r.net, 0).toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
