import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin, DatePicker, Select } from 'antd';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FiFilter, FiBarChart2, FiEye, FiRefreshCw, FiChevronRight, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import dayjs from 'dayjs';

// Firebase collection paths
const ROUTES_PATH = 'schooler_system/transport_management/bus_routes';
const ALLOCATIONS_PATH = 'schooler_system/transport_management/student_allocations';
const PUNCH_TIMINGS_PATH = 'schooler_system/transport_management/punch_timings';
const PUNCH_LOGS_PATH = 'schooler_system/transport_management/punch_logs';

export default function StudentPunchDetail() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [shifts, setShifts] = useState([]);
    
    // Filters
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [selectedShift, setSelectedShift] = useState(null);

    useEffect(() => {
        fetchShifts();
    }, []);

    useEffect(() => {
        if (selectedDate && selectedShift) {
            generateReport();
        }
    }, [selectedDate, selectedShift]);

    const fetchShifts = async () => {
        try {
            const snapshot = await getDocs(collection(db, PUNCH_TIMINGS_PATH));
            const shiftData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setShifts(shiftData);
            if (shiftData.length > 0) {
                setSelectedShift(shiftData[0].id);
            }
        } catch (err) {
            console.error('Error fetching shifts:', err);
        }
    };

    const generateReport = async () => {
        setLoading(true);
        try {
            // 1. Fetch Master Routes
            const routesSnapshot = await getDocs(collection(db, ROUTES_PATH));
            const routes = routesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // 2. Fetch All Allocations
            const allocationsSnapshot = await getDocs(collection(db, ALLOCATIONS_PATH));
            const allocations = allocationsSnapshot.docs.map(d => d.data());

            // 3. Fetch Punches for selected Date and Shift
            const dateStr = selectedDate.format('YYYY-MM-DD');
            const punchesSnapshot = await getDocs(
                query(
                    collection(db, PUNCH_LOGS_PATH),
                    where('date', '==', dateStr),
                    where('shift_id', '==', selectedShift)
                )
            );
            const punches = punchesSnapshot.docs.map(d => d.data());

            // 4. Aggregate Data per Route
            const aggregated = routes.map(route => {
                const routeId = route.id;
                const routeName = route.display_name || route.route_name;
                
                // Students assigned to this route
                const assignedStudents = allocations.filter(a => a.route_id === routeId);
                const totalStudents = assignedStudents.length;

                // Students who punched for this route
                const punchedForRoute = punches.filter(p => 
                    assignedStudents.some(s => s.student_id === p.student_id)
                );

                const present = punchedForRoute.length;
                const absent = totalStudents - present;
                
                // Pending logic (e.g. if expected to punch but haven't yet)
                const pending = totalStudents > 0 && present === 0 ? totalStudents : 0; 

                return {
                    id: routeId,
                    route_name: routeName,
                    punch_no: route.short_code || 'N/A',
                    total_student: totalStudents,
                    present: present,
                    absent: absent,
                    boarding_pending: pending
                };
            });

            setReportData(aggregated);
        } catch (err) {
            console.error('Report generation failed:', err);
            notification.error({ message: 'Error generating report' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 max-w-[1600px] mx-auto pb-40 text-gray-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        <span>Transport</span>
                        <FiChevronRight className="w-3 h-3" />
                        <span>Reports</span>
                        <FiChevronRight className="w-3 h-3" />
                        <span className="text-blue-600 font-black">Student Punch Detail</span>
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight font-inter">Student Punch Detail</h1>
                    <p className="text-gray-500 text-lg font-medium mt-2 leading-relaxed max-w-2xl">
                        Monitor real-time transport attendance across all routes. Track present, absent, and boarding status.
                    </p>
                </div>
                <button
                    className="px-6 py-3.5 bg-white text-gray-700 font-bold rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                    onClick={generateReport}
                    disabled={loading}
                >
                    <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Analytics
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-2xl shadow-black/[0.02] mb-10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <FiFilter className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Report Configuration</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-3">
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Reporting Date</label>
                        <DatePicker 
                            className="w-full h-14 rounded-2xl border-gray-200 text-base font-medium shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" 
                            format="DD/MM/YYYY"
                            value={selectedDate}
                            onChange={setSelectedDate}
                            allowClear={false}
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Punch Shift / Type</label>
                        <Select
                            className="w-full h-14 text-base font-medium"
                            placeholder="Select Punch Type"
                            value={selectedShift}
                            onChange={setSelectedShift}
                            options={shifts.map(s => ({ value: s.id, label: s.punch_shift }))}
                            dropdownStyle={{ borderRadius: '1rem', padding: '8px' }}
                        />
                    </div>
                    <div className="flex items-end">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 w-full flex items-center gap-3">
                            <FiBarChart2 className="w-6 h-6 text-blue-600" />
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Routes</div>
                                <div className="text-xl font-black text-gray-900">{reportData.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-black/[0.02] overflow-hidden">
                <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">Fleet Attendance Matrix</h3>
                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Live Dashboard
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-50">Route Name</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-50 text-center">Punch No.</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-50 text-center">Total Students</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-50 text-center">Present</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-50 text-center">Absent</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-50 text-center">Boarding Pending</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-50 text-right">Perspective</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-5">
                                            <div className="w-16 h-16 border-[5px] border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                                            <span className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Crunching Analytics...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-10 py-24 text-center">
                                        <div className="max-w-xs mx-auto opacity-40">
                                            <FiBarChart2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                            <h4 className="text-gray-900 font-bold tracking-tight text-lg mb-1">No Data Available</h4>
                                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Configure filters to view reports</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reportData.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/20 group transition-all">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 text-sm group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                    {(row.route_name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-gray-900 text-lg tracking-tight group-hover:text-blue-700 transition-colors">
                                                    {row.route_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-200/50">
                                                {row.punch_no}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center font-black text-xl text-gray-900">
                                            {row.total_student}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xl font-black text-green-600">{row.present}</span>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 text-[9px] font-black rounded-full border border-green-100">
                                                    <FiCheckCircle className="w-2.5 h-2.5" />
                                                    PRESENT
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xl font-black text-red-600">{row.absent}</span>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-700 text-[9px] font-black rounded-full border border-red-100">
                                                    <FiXCircle className="w-2.5 h-2.5" />
                                                    ABSENT
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-xl font-black text-orange-600">{row.boarding_pending}</span>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 text-orange-700 text-[9px] font-black rounded-full border border-orange-100">
                                                    <FiClock className="w-2.5 h-2.5" />
                                                    PENDING
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button
                                                className="px-6 py-2.5 bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-black/10 hover:bg-black transition-all active:scale-95 flex items-center gap-2 ml-auto"
                                                onClick={() => notification.info({ message: 'Detailed view coming soon', description: `Showing details for ${row.route_name}` })}
                                            >
                                                <FiEye className="w-3.5 h-3.5" />
                                                View More
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
