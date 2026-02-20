import React from 'react';

export default function SalaryPaymentsECS() {
    const sampleData = [
        { employee: 'HR-EMP-00001', employee_name: 'Rahul Sharma', bank_name: 'HDFC Bank', account_no: 'XXXX1234', ifsc: 'HDFC0001234', net_pay: 46800 },
        { employee: 'HR-EMP-00002', employee_name: 'Priya Patel', bank_name: 'ICICI Bank', account_no: 'XXXX5678', ifsc: 'ICIC0005678', net_pay: 60900 },
        { employee: 'HR-EMP-00003', employee_name: 'Amit Kumar', bank_name: 'SBI', account_no: 'XXXX9012', ifsc: 'SBIN0009012', net_pay: 32750 },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Salary Payments via ECS</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">⬇ Export Excel</button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Generate ECS File</button>
                </div>
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
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Bank</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Account No</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">IFSC</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-600">Net Pay</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">{row.employee}</td>
                                <td className="px-4 py-3">{row.employee_name}</td>
                                <td className="px-4 py-3">{row.bank_name}</td>
                                <td className="px-4 py-3 font-mono text-xs">{row.account_no}</td>
                                <td className="px-4 py-3 font-mono text-xs">{row.ifsc}</td>
                                <td className="px-4 py-3 text-right font-medium">₹{row.net_pay.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-100 font-semibold">
                            <td className="px-4 py-3" colSpan={5}>Total</td>
                            <td className="px-4 py-3 text-right">₹{sampleData.reduce((s, r) => s + r.net_pay, 0).toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
