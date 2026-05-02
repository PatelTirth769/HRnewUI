import React, { useEffect, useState } from 'react';
import { notification, Spin } from 'antd';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiSave, FiRefreshCw } from 'react-icons/fi';

const CONFIG_PATH = 'schooler_system/enquiry_management/config/follow_up_settings';

export default function FollowUpDays() {
    const [days, setDays] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, CONFIG_PATH);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setDays(docSnap.data().noOfDays || '');
            }
        } catch (err) {
            console.error('Fetch config failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!days) {
            notification.warning({ message: 'Input Required', description: 'Please enter the number of days.' });
            return;
        }

        setSaving(true);
        try {
            const docRef = doc(db, CONFIG_PATH);
            await setDoc(docRef, {
                noOfDays: days,
                updated_at: serverTimestamp()
            }, { merge: true });
            notification.success({ message: 'Success', description: 'Follow up days updated successfully.' });
        } catch (err) {
            notification.error({ message: 'Save Failed', description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setDays('');
    };

    return (
        <div className="p-6 max-w-[1200px] mx-auto pb-24 text-gray-800 font-inter">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Follow Up Days</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Enquiry</span> / <span className="text-blue-600 font-bold">Follow Up Days</span>
                    </div>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-700">Follow Up Days</h2>
                </div>
                
                <Spin spinning={loading}>
                    <div className="p-8 space-y-6">
                        <div className="flex flex-col gap-2 max-w-2xl">
                            <label className="text-[13px] font-semibold text-gray-600">Enter No Of Days</label>
                            <input
                                type="number"
                                value={days}
                                onChange={(e) => setDays(e.target.value)}
                                placeholder="Enter No Of Days"
                                className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Spin size="small" /> : <FiSave className="w-4 h-4" />} Save
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-8 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-bold hover:bg-gray-200 transition-all border border-gray-200"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </Spin>
            </div>
        </div>
    );
}
