import React, { useState } from 'react';

export default function PayrollEntry() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Payroll Entry</h1>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">+ New Payroll Entry</button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-700 mb-4">Payroll Entry Details</h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Company *</label>
                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                            <option value="">Select Company</option>
                            <option>Preeshe Technologies</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Payroll Frequency *</label>
                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                            <option value="">Select Frequency</option>
                            <option>Monthly</option>
                            <option>Bi-weekly</option>
                            <option>Weekly</option>
                            <option>Daily</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Posting Date *</label>
                        <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                        <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">End Date</label>
                        <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Currency</label>
                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                            <option>INR</option>
                            <option>USD</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Department</label>
                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                            <option value="">All Departments</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Designation</label>
                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                            <option value="">All Designations</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Branch</label>
                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                            <option value="">All Branches</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 mb-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" /> Salary Slip based on Timesheet
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" /> Deduct Tax for Unclaimed Employee Benefits
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" /> Deduct Tax for Unsubmitted Tax Exemption Proof
                    </label>
                </div>

                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Get Employees</button>
                    <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">Create Salary Slips</button>
                    <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">Submit Salary Slips</button>
                    <button className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700">Make Bank Entry</button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-700 mb-4">Employees</h2>
                <div className="text-sm text-gray-500 text-center py-8">Click "Get Employees" to load the employee list for this payroll entry.</div>
            </div>
        </div>
    );
}
