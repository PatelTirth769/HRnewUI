import React from 'react';

export default function SalaryPaymentsMode() {
    const sampleData = [
        { payment_mode: 'Bank Transfer', bank: 'HDFC Bank', count: 45, total_amount: 2250000 },
        { payment_mode: 'Bank Transfer', bank: 'ICICI Bank', count: 30, total_amount: 1800000 },
        { payment_mode: 'Cash', bank: '-', count: 5, total_amount: 125000 },
        { payment_mode: 'Cheque', bank: 'SBI', count: 3, total_amount: 180000 },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Salary Payments Based on Payment Mode</h1>
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
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Payment Mode</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Bank</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-600">Employee Count</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-600">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleData.map((row, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs ${row.payment_mode === 'Bank Transfer' ? 'bg-blue-50 text-blue-700' : row.payment_mode === 'Cash' ? 'bg-yellow-50 text-yellow-700' : 'bg-purple-50 text-purple-700'}`}>
                                        {row.payment_mode}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{row.bank}</td>
                                <td className="px-4 py-3 text-right">{row.count}</td>
                                <td className="px-4 py-3 text-right font-medium">₹{row.total_amount.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-100 font-semibold">
                            <td className="px-4 py-3" colSpan={2}>Total</td>
                            <td className="px-4 py-3 text-right">{sampleData.reduce((s, r) => s + r.count, 0)}</td>
                            <td className="px-4 py-3 text-right">₹{sampleData.reduce((s, r) => s + r.total_amount, 0).toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
