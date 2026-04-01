import React, { useState, useEffect } from 'react';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const POSSettings = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ submit_transactions_immediately: 0 });

    useEffect(() => { fetchDetails(); }, []);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const r = await API.get('/api/resource/POS Settings/POS Settings');
            setFormData(r.data.data);
        } catch { 
            // If not found, it might haven't been created yet.
        } finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await API.put('/api/resource/POS Settings/POS Settings', formData);
            notification.success({ message: 'Saved.' });
        } catch (e) {
            notification.error({ message: 'Save Failed', description: e.message });
        } finally { setSaving(false); }
    };

    const lbl = "block text-[13px] text-gray-500 mb-1 font-medium";

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800 font-inter">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">POS Settings</h1>
                <button onClick={handleSave} disabled={saving} className="bg-black text-white px-6 py-2 rounded text-sm font-bold shadow-sm hover:bg-gray-800 disabled:opacity-50 transition-all">Save</button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                <Spin spinning={loading}>
                    <div className="space-y-6">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={!!formData.submit_transactions_immediately} onChange={e => setFormData({ ...formData, submit_transactions_immediately: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                            <span className="text-sm font-semibold text-gray-700 group-hover:text-black">Submit Transactions Immediately</span>
                        </label>
                    </div>
                </Spin>
            </div>
        </div>
    );
};

export default POSSettings;
