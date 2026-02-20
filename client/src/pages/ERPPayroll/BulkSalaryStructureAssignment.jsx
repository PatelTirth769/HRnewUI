import React, { useState } from 'react';

export default function BulkSalaryStructureAssignment() {
    const [dragOver, setDragOver] = useState(false);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Bulk Salary Structure Assignment</h1>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-700 mb-4">Assignment Details</h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Company *</label>
                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                            <option value="">Select Company</option>
                            <option>Preeshe Technologies</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Salary Structure *</label>
                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                            <option value="">Select Salary Structure</option>
                            <option>Basic + HRA + DA</option>
                            <option>CTC Based Structure</option>
                            <option>Contractual Pay</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">From Date *</label>
                        <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
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
                        <label className="block text-sm text-gray-600 mb-1">Grade</label>
                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                            <option value="">All Grades</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Get Employees</button>
                    <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">Assign Structure</button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-700 mb-4">Or Upload via File</h2>
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
                >
                    <p className="text-gray-500 text-sm mb-2">Drag & drop a CSV/XLS file here</p>
                    <p className="text-gray-400 text-xs mb-3">or</p>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200">Browse Files</button>
                </div>
                <button className="mt-3 text-blue-600 text-sm hover:underline">⬇ Download Template</button>
            </div>
        </div>
    );
}
