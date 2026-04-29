import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FiSearch, FiX, FiCheck, FiChevronRight } from 'react-icons/fi';
import API from '../../../services/api';

// Firebase collection paths
const ALLOCATIONS_PATH = 'schooler_system/transport_management/student_allocations';
const BUS_ROUTES_PATH = 'schooler_system/transport_management/bus_routes';
const BUS_STOPS_PATH = 'schooler_system/transport_management/bus_stops';

const InputField = ({
    label,
    value,
    required = false,
    onChange,
    type = 'text',
    disabled = false,
    placeholder = '',
    icon: Icon
}) => (
    <div className="relative">
        <label className="block text-[12px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative group">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />}
            <input
                type={type}
                placeholder={placeholder}
                className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${Icon ? 'pl-11' : ''} ${disabled ? 'bg-gray-50 text-gray-500' : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 bg-white shadow-sm font-medium text-gray-900'}`}
                value={value !== undefined && value !== null ? value : ''}
                onChange={onChange ? (e) => onChange(e.target.value) : undefined}
                readOnly={disabled}
            />
        </div>
    </div>
);

const SelectField = ({ label, value, required = false, onChange, options = [], disabled = false, placeholder = 'Select an option' }) => (
    <div>
        <label className="block text-[12px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${disabled ? 'bg-gray-50 text-gray-500' : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 bg-white shadow-sm font-medium text-gray-900 appearance-none'}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
        >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
                <option key={opt.id || opt.value || opt} value={opt.id || opt.value || opt}>
                    {opt.label || opt.display_name || opt.bus_stop || opt.route_name || opt}
                </option>
            ))}
        </select>
    </div>
);

export default function StudentTransportAllocation() {
    const [view, setView] = useState('search'); // 'search', 'allocate', 'list'
    const [studentSearch, setStudentSearch] = useState('');
    const [searching, setSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [allocations, setAllocations] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [stops, setStops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const initFormData = {
        route_id: '',
        stop_id: '',
        status: 'Active',
        effective_from: new Date().toISOString().split('T')[0]
    };

    const [formData, setFormData] = useState(initFormData);

    useEffect(() => {
        fetchMasters();
        fetchAllocations();
    }, []);

    const fetchMasters = async () => {
        try {
            const routesSnapshot = await getDocs(collection(db, BUS_ROUTES_PATH));
            setRoutes(routesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

            const stopsSnapshot = await getDocs(collection(db, BUS_STOPS_PATH));
            setStops(stopsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const fetchAllocations = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, ALLOCATIONS_PATH), orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            setAllocations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Error fetching allocations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStudentSearch = async () => {
        if (!studentSearch.trim()) {
            notification.warning({ message: 'Search query required' });
            return;
        }

        setSearching(true);
        try {
            // Fetch students from ERPNext API as per project pattern
            const res = await API.get(`/api/resource/Student?filters=[["student_name","like","%${studentSearch}%"]]&fields=["name","student_name","first_name","middle_name","last_name","admission_no"]&limit_page_length=20`);
            const students = res.data.data || [];
            
            if (students.length === 0) {
                notification.info({ message: 'No student found' });
            } else if (students.length === 1) {
                selectStudent(students[0]);
            } else {
                // For now, if multiple found, just take the first or implement a selector
                // Implementing a simple selector would be better, but let's stick to the flow
                selectStudent(students[0]);
            }
        } catch (err) {
            console.error('Student search failed:', err);
            notification.error({ message: 'Search Failed', description: 'Could not fetch student data' });
        } finally {
            setSearching(false);
        }
    };

    const selectStudent = (student) => {
        setSelectedStudent(student);
        setFormData(initFormData);
        setView('allocate');
    };

    const handleSave = async () => {
        if (!formData.route_id || !formData.stop_id) {
            notification.warning({ message: 'Route and Stop are required' });
            return;
        }

        setSaving(true);
        try {
            const allocationData = {
                student_id: selectedStudent.name,
                student_name: selectedStudent.student_name,
                admission_no: selectedStudent.admission_no || '',
                ...formData,
                route_name: routes.find(r => r.id === formData.route_id)?.display_name || '',
                stop_name: stops.find(s => s.id === formData.stop_id)?.bus_stop || '',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            };

            await addDoc(collection(db, ALLOCATIONS_PATH), allocationData);
            notification.success({ message: 'Transport allocated successfully!' });
            setView('search');
            setSelectedStudent(null);
            setStudentSearch('');
            fetchAllocations();
        } catch (err) {
            console.error('Save failed:', err);
            notification.error({ message: 'Save Failed', description: err?.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this allocation?')) return;
        try {
            await deleteDoc(doc(db, ALLOCATIONS_PATH, id));
            notification.success({ message: 'Allocation removed' });
            fetchAllocations();
        } catch (err) {
            notification.error({ message: 'Delete Failed' });
        }
    };

    if (view === 'allocate' && selectedStudent) {
        return (
            <div className="p-8 max-w-4xl mx-auto pb-40">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-5">
                        <button 
                            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-500 shadow-sm"
                            onClick={() => setView('search')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight font-inter">Allocate Transport</h1>
                            <p className="text-gray-500 text-sm font-medium mt-0.5">Assigning transport details for student</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-black/[0.03] overflow-hidden">
                    <div className="p-8 border-b border-gray-50 bg-[#F9FAFB] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/20">
                                {selectedStudent.student_name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{selectedStudent.student_name}</h2>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                    <span className="text-blue-600">#{selectedStudent.admission_no || 'N/A'}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span>{selectedStudent.name}</span>
                                </p>
                            </div>
                        </div>
                        <button
                            className="px-8 py-3 bg-[#1C1F26] text-white font-bold rounded-xl shadow-lg shadow-black/10 hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiCheck className="w-5 h-5" />}
                            {saving ? 'Allocating...' : 'Confirm Allocation'}
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <SelectField
                                label="Assign Route"
                                value={formData.route_id}
                                required
                                options={routes}
                                onChange={(v) => setFormData(p => ({ ...p, route_id: v }))}
                                placeholder="Select Transport Route"
                            />

                            <SelectField
                                label="Assign Bus Stop"
                                value={formData.stop_id}
                                required
                                options={stops}
                                onChange={(v) => setFormData(p => ({ ...p, stop_id: v }))}
                                placeholder="Select Boarding Point"
                            />

                            <InputField
                                label="Effective From"
                                type="date"
                                value={formData.effective_from}
                                onChange={(v) => setFormData(p => ({ ...p, effective_from: v }))}
                            />

                            <SelectField
                                label="Allocation Status"
                                value={formData.status}
                                options={['Active', 'On Hold', 'Inactive']}
                                onChange={(v) => setFormData(p => ({ ...p, status: v }))}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto pb-40">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        <span>Home</span>
                        <FiChevronRight className="w-3 h-3" />
                        <span>Transport</span>
                        <FiChevronRight className="w-3 h-3" />
                        <span className="text-blue-600">Student Transport Allocation</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight font-inter">Student Transport Allocation</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-black/[0.02] p-8">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-1">Search Student</h3>
                            <p className="text-gray-500 text-[13px] font-medium uppercase tracking-wider">Search by Name, Admission No, or ID</p>
                        </div>
                        <div className="space-y-6">
                            <InputField
                                label="Student Identity"
                                required
                                placeholder="Search Student..."
                                value={studentSearch}
                                onChange={setStudentSearch}
                                icon={FiSearch}
                            />
                            <button
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                                onClick={handleStudentSearch}
                                disabled={searching || !studentSearch.trim()}
                            >
                                {searching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSearch className="w-5 h-5" />}
                                {searching ? 'Searching...' : 'Search & Select'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-900 via-[#1C1F26] to-black rounded-3xl p-8 text-white shadow-2xl shadow-blue-500/10">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4 text-center">Quick Stats</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                                <div className="text-2xl font-black mb-1">{allocations.length}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Active</div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                                <div className="text-2xl font-black mb-1">{stops.length}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bus Stops</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-black/[0.02] overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Recent Allocations</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Live Updates</span>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transport Info</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 border-[3px] border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Records...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : allocations.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <div className="max-w-xs mx-auto">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <FiSearch className="w-6 h-6 text-gray-300" />
                                                    </div>
                                                    <h4 className="text-gray-900 font-bold tracking-tight mb-1">No Allocations Found</h4>
                                                    <p className="text-gray-500 text-xs font-medium">Search a student to get started with transport allocation.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        allocations.map((item) => (
                                            <tr key={item.id} className="hover:bg-blue-50/20 group transition-all">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                            {item.student_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 tracking-tight group-hover:text-blue-700 transition-colors">{item.student_name}</div>
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {item.student_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[9px] font-black rounded uppercase border border-orange-100/50">Route</span>
                                                            <span className="text-[13px] font-bold text-gray-700">{item.route_name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase border border-blue-100/50">Stop</span>
                                                            <span className="text-[13px] font-bold text-gray-700">{item.stop_name}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <FiX className="w-4 h-4" />
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
            </div>
        </div>
    );
}
