import React, { useState } from 'react';

export default function TaxExemptionCategories() {
    const [activeTab, setActiveTab] = useState('category');

    const categories = [
        { name: 'House Rent Allowance', max_amount: 100000 },
        { name: 'Leave Travel Allowance', max_amount: 50000 },
        { name: '80C - Life Insurance', max_amount: 150000 },
        { name: '80D - Medical Insurance', max_amount: 25000 },
        { name: '80E - Education Loan', max_amount: 0 },
        { name: '80G - Donations', max_amount: 0 },
    ];

    const subCategories = [
        { name: 'PPF', category: '80C - Life Insurance', max_amount: 150000 },
        { name: 'ELSS Mutual Fund', category: '80C - Life Insurance', max_amount: 150000 },
        { name: 'Life Insurance Premium', category: '80C - Life Insurance', max_amount: 150000 },
        { name: 'National Savings Certificate', category: '80C - Life Insurance', max_amount: 150000 },
        { name: 'Self Premium', category: '80D - Medical Insurance', max_amount: 25000 },
        { name: 'Parents Premium', category: '80D - Medical Insurance', max_amount: 50000 },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Tax Exemption Categories</h1>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">+ New {activeTab === 'category' ? 'Category' : 'Sub Category'}</button>
            </div>

            <div className="flex gap-2 mb-4">
                <button
                    className={`px-4 py-2 text-sm rounded border ${activeTab === 'category' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    onClick={() => setActiveTab('category')}
                >
                    Categories
                </button>
                <button
                    className={`px-4 py-2 text-sm rounded border ${activeTab === 'sub' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    onClick={() => setActiveTab('sub')}
                >
                    Sub Categories
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {activeTab === 'category' ? (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Category Name</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Max Amount</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((row, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 text-blue-600 cursor-pointer">{row.name}</td>
                                    <td className="px-4 py-3 text-right">{row.max_amount ? `₹${row.max_amount.toLocaleString('en-IN')}` : 'No Limit'}</td>
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
                                        <button className="text-red-600 hover:underline text-xs">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Sub Category Name</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Max Amount</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subCategories.map((row, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 text-blue-600 cursor-pointer">{row.name}</td>
                                    <td className="px-4 py-3">{row.category}</td>
                                    <td className="px-4 py-3 text-right">{row.max_amount ? `₹${row.max_amount.toLocaleString('en-IN')}` : 'No Limit'}</td>
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
                                        <button className="text-red-600 hover:underline text-xs">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
