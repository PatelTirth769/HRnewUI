import React, { useState } from 'react';

export default function IncomeTaxSlab() {
    const [activeTab, setActiveTab] = useState('new');
    const tabs = [
        { key: 'new', label: 'New Regime' },
        { key: 'old', label: 'Old Regime' },
    ];

    const newRegimeSlabs = [
        { from: 0, to: 300000, rate: 0 },
        { from: 300001, to: 700000, rate: 5 },
        { from: 700001, to: 1000000, rate: 10 },
        { from: 1000001, to: 1200000, rate: 15 },
        { from: 1200001, to: 1500000, rate: 20 },
        { from: 1500001, to: 0, rate: 30 },
    ];

    const oldRegimeSlabs = [
        { from: 0, to: 250000, rate: 0 },
        { from: 250001, to: 500000, rate: 5 },
        { from: 500001, to: 1000000, rate: 20 },
        { from: 1000001, to: 0, rate: 30 },
    ];

    const slabs = activeTab === 'new' ? newRegimeSlabs : oldRegimeSlabs;

    const formatCurrency = (val) => val === 0 && activeTab ? 'Above' : `₹${val.toLocaleString('en-IN')}`;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Income Tax Slab</h1>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">+ New Tax Slab</button>
            </div>

            <div className="flex gap-3 mb-4">
                <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                    <option value="">Effective From</option>
                    <option>2025-04-01</option>
                    <option>2024-04-01</option>
                </select>
                <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                    <option value="">Company</option>
                    <option>Preeshe Technologies</option>
                </select>
            </div>

            <div className="flex gap-2 mb-4">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={`px-4 py-2 text-sm rounded border ${activeTab === t.key ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">From Amount</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">To Amount</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Tax Rate (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {slabs.map((slab, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                                <td className="px-4 py-3">₹{slab.from.toLocaleString('en-IN')}</td>
                                <td className="px-4 py-3">{slab.to === 0 ? 'Above' : `₹${slab.to.toLocaleString('en-IN')}`}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${slab.rate === 0 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                        {slab.rate}%
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
