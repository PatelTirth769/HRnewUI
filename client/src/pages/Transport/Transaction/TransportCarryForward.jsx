import React, { useState } from 'react';
import { notification, Select, Checkbox, Button, Modal } from 'antd';
import { collection, getDocs, writeBatch, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FiChevronRight, FiRepeat, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

const { Option } = Select;

// Collection paths
const ROUTES_PATH = 'schooler_system/transport_management/bus_routes';
const STOPS_PATH = 'schooler_system/transport_management/bus_stops';

export default function TransportCarryForward() {
    const [loading, setLoading] = useState(false);
    const [fromYear, setFromYear] = useState('2025-2026');
    const [toYear, setToYear] = useState('2026-2027');
    const [options, setOptions] = useState({
        busRoutes: true,
        busStops: true
    });

    const handleCarryForward = async () => {
        if (fromYear === toYear) {
            notification.warning({ message: 'Source and target academic years cannot be the same.' });
            return;
        }

        Modal.confirm({
            title: 'Confirm Carry Forward',
            icon: <FiAlertCircle className="text-orange-500 w-6 h-6 mr-2" />,
            content: `This will copy selected transport data from ${fromYear} to ${toYear}. Existing data in ${toYear} will not be deleted, but duplicates may be created if not careful. Proceed?`,
            okText: 'Yes, Carry Forward',
            cancelText: 'Cancel',
            okButtonProps: { className: 'bg-green-600' },
            onOk: startMigration
        });
    };

    const startMigration = async () => {
        setLoading(true);
        try {
            const batch = writeBatch(db);
            let totalCount = 0;

            // 1. Carry Forward Bus Routes
            if (options.busRoutes) {
                const routesRef = collection(db, ROUTES_PATH);
                const q = query(routesRef, where('academic_year', '==', fromYear));
                const snapshot = await getDocs(q);
                
                snapshot.forEach((sourceDoc) => {
                    const data = sourceDoc.data();
                    const newDocRef = doc(routesRef);
                    batch.set(newDocRef, {
                        ...data,
                        academic_year: toYear,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        cloned_from: sourceDoc.id
                    });
                    totalCount++;
                });
            }

            // 2. Carry Forward Bus Stops
            if (options.busStops) {
                const stopsRef = collection(db, STOPS_PATH);
                const q = query(stopsRef, where('academic_year', '==', fromYear));
                const snapshot = await getDocs(q);

                snapshot.forEach((sourceDoc) => {
                    const data = sourceDoc.data();
                    const newDocRef = doc(stopsRef);
                    batch.set(newDocRef, {
                        ...data,
                        academic_year: toYear,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        cloned_from: sourceDoc.id
                    });
                    totalCount++;
                });
            }

            if (totalCount > 0) {
                await batch.commit();
                notification.success({
                    message: 'Carry Forward Successful',
                    description: `Successfully migrated ${totalCount} records to academic year ${toYear}.`
                });
            } else {
                notification.info({ message: 'No records found to carry forward for the selected criteria.' });
            }
        } catch (error) {
            console.error('Carry forward error:', error);
            notification.error({ message: 'Error occurred during carry forward process.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    <span>Home</span>
                    <FiChevronRight className="w-3 h-3" />
                    <span>Transport</span>
                    <FiChevronRight className="w-3 h-3" />
                    <span className="text-blue-600">Transport Carry Forward</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Transport Carry Forward</h1>
                <p className="text-gray-500 font-medium mt-2">Migrate transportation master data to the next academic cycle.</p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-black/[0.02] p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl -z-1"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                            From Academic Year <span className="text-red-500">*</span>
                        </label>
                        <Select 
                            className="w-full h-12" 
                            value={fromYear} 
                            onChange={setFromYear}
                            disabled
                        >
                            <Option value="2025-2026">2025-2026 (Current)</Option>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                            To Academic Year <span className="text-red-500">*</span>
                        </label>
                        <Select 
                            className="w-full h-12" 
                            value={toYear} 
                            onChange={setToYear}
                        >
                            <Option value="2026-2027">2026-2027</Option>
                            <Option value="2027-2028">2027-2028</Option>
                        </Select>
                    </div>
                </div>

                {/* Selection Options */}
                <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 mb-10">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <FiInfo className="text-blue-600" /> Select Data to Carry Forward
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 transition-all cursor-pointer shadow-sm group" onClick={() => setOptions({...options, busRoutes: !options.busRoutes})}>
                            <Checkbox checked={options.busRoutes} onChange={e => setOptions({...options, busRoutes: e.target.checked})} className="mr-4" />
                            <span className="text-sm font-bold text-gray-700">Transport Bus Route</span>
                        </div>
                        <div className="flex items-center p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 transition-all cursor-pointer shadow-sm group" onClick={() => setOptions({...options, busStops: !options.busStops})}>
                            <Checkbox checked={options.busStops} onChange={e => setOptions({...options, busStops: e.target.checked})} className="mr-4" />
                            <span className="text-sm font-bold text-gray-700">Transport Route Wise Bus Stop</span>
                        </div>
                    </div>
                </div>

                {/* Action Area */}
                <div className="flex justify-start">
                    <Button 
                        type="primary"
                        icon={loading ? null : <FiRepeat />}
                        loading={loading}
                        onClick={handleCarryForward}
                        className="h-14 px-12 bg-green-600 hover:bg-green-700 border-none rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-green-200 transition-all active:scale-95"
                    >
                        {loading ? 'Processing...' : 'Start Carry Forward'}
                    </Button>
                </div>
            </div>

            {/* Helpful Note */}
            <div className="mt-8 p-6 bg-orange-50 rounded-3xl border border-orange-100 flex items-start gap-4">
                <FiAlertCircle className="text-orange-500 w-6 h-6 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-black text-orange-900 uppercase tracking-widest mb-1">Important Note</h4>
                    <p className="text-xs text-orange-700 font-medium leading-relaxed">
                        Carry forward only copies the master definitions (Routes and Stops).
                        Student allocations and fee collections are NOT migrated as they require a fresh setup each year.
                    </p>
                </div>
            </div>

            <div className="mt-12 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
                Powered by : Microweb Solutions ®
            </div>
        </div>
    );
}
