import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import * as XLSX from 'xlsx';
import { FaDownload, FaSearch } from 'react-icons/fa';
import API from '../../services/api';

const TrainingNeedsIdentification = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            // Fetch active employees with name, employee_name, and branch (location)
            const response = await API.get('/api/resource/Employee?fields=["name","employee_name","branch"]&filters=[["status","=","Active"]]&limit_page_length=None');
            setEmployees(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
            notification.error({ message: 'Failed to load employee data' });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (employees.length === 0) {
            notification.warning({ message: 'No data to export' });
            return;
        }

        // Prepare data for export matching the UI layout
        const exportData = employees.map((emp, index) => ({
            'Sl. #': index + 1,
            'Name of the Employee': emp.employee_name || emp.name,
            'Location (Head Office/ Factory/ Region)': emp.branch || '',
            'Behavioural & Attitudinal Training': '',
            'Skills Development & Functional Related Training': '',
            'Awareness Training': '',
            'Remarks': ''
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);

        // Optional: Set column widths for better readability in Excel
        const wscols = [
            { wch: 6 },  // Sl. #
            { wch: 30 }, // Name
            { wch: 25 }, // Location
            { wch: 30 }, // Behavioural
            { wch: 40 }, // Skills
            { wch: 25 }, // Awareness
            { wch: 30 }  // Remarks
        ];
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Training Needs');
        XLSX.writeFile(wb, `Training_Needs_Identification_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const filteredEmployees = employees.filter(emp =>
        (emp.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.branch || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-center mb-6">
                    <p className="font-semibold text-gray-800">(Corporate Services)</p>
                    <h1 className="text-lg font-bold text-gray-900 mt-1">Training Needs Identification Form</h1>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="relative w-72">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search Employee or Location..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-400 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium text-sm"
                    >
                        <FaDownload className="w-4 h-4" /> Export to Excel
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th rowSpan={2} className="border border-gray-200 px-4 py-3 font-semibold text-gray-700 w-16">Sl. #</th>
                                <th rowSpan={2} className="border border-gray-200 px-4 py-3 font-semibold text-gray-700 text-left w-64">Name of the Employee</th>
                                <th className="border border-gray-200 px-4 py-2 font-semibold text-gray-700 w-48 bg-gray-100">Location</th>
                                <th colSpan={3} className="border border-gray-200 px-4 py-2 font-semibold text-gray-700 bg-gray-100">Training Category</th>
                                <th rowSpan={2} className="border border-gray-200 px-4 py-3 font-semibold text-gray-700 w-48">Remarks</th>
                            </tr>
                            <tr className="bg-gray-50">
                                <th className="border border-gray-200 px-4 py-2 font-normal text-xs text-gray-600">(Head Office/ Factory/ Region)</th>
                                <th className="border border-gray-200 px-4 py-2 font-semibold text-gray-700 text-xs w-48">Behavioural & Attitudinal Training</th>
                                <th className="border border-gray-200 px-4 py-2 font-semibold text-gray-700 text-xs w-56">Skills Development & Functional Related Training</th>
                                <th className="border border-gray-200 px-4 py-2 font-semibold text-gray-700 text-xs w-40">Awareness Training</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                        <p className="text-gray-500">Loading employees...</p>
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-500">
                                        No employees found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp, index) => (
                                    <tr key={emp.name} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="border border-gray-200 px-4 py-2.5 text-gray-500">{index + 1}</td>
                                        <td className="border border-gray-200 px-4 py-2.5 text-left font-medium text-gray-800">{emp.employee_name || emp.name}</td>
                                        <td className="border border-gray-200 px-4 py-2.5 text-gray-600">{emp.branch || '-'}</td>
                                        {/* Empty columns for printing/filling */}
                                        <td className="border border-gray-200 px-4 py-2.5 bg-gray-50/50"></td>
                                        <td className="border border-gray-200 px-4 py-2.5 bg-gray-50/50"></td>
                                        <td className="border border-gray-200 px-4 py-2.5 bg-gray-50/50"></td>
                                        <td className="border border-gray-200 px-4 py-2.5 bg-gray-50/50"></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-4 px-2">Click Export to Excel to download this template for filling.</p>
        </div>
    );
};

export default TrainingNeedsIdentification;
