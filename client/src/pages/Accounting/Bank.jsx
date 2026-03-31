import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    bank_name: '',
    website: '',
    swift_number: '',
    bank_transaction_mapping: [],
});

const Bank = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState(emptyForm());
    const [isMappingOpen, setIsMappingOpen] = useState(true);

    useEffect(() => {
        if (view === 'list') {
            fetchBanks();
        } else if (editingRecord) {
            fetchDetails(editingRecord);
        } else {
            setFormData(emptyForm());
        }
    }, [view, editingRecord]);

    const fetchBanks = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Bank?fields=["name","bank_name","swift_number","website"]&limit_page_length=None&order_by=name asc');
            setBanks(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch banks' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Bank/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.bank_name) {
            notification.warning({ message: 'Validation', description: 'Bank Name is required' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Bank/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Bank updated successfully' });
            } else {
                await API.post('/api/resource/Bank', formData);
                notification.success({ message: 'Bank created successfully' });
            }
            setView('list');
            fetchBanks();
        } catch (err) {
            notification.error({ message: 'Error', description: err.response?.data?._server_messages || 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await API.delete(`/api/resource/Bank/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted' });
            setView('list');
            fetchBanks();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const addRow = () => {
        setFormData({
            ...formData,
            bank_transaction_mapping: [...formData.bank_transaction_mapping, { field_in_bank_transaction: '', column_in_bank_file: '' }]
        });
    };

    const updateRow = (idx, field, val) => {
        const updated = [...formData.bank_transaction_mapping];
        updated[idx][field] = val;
        setFormData({ ...formData, bank_transaction_mapping: updated });
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm";
    const labelStyle = "block text-[13px] text-gray-500 mb-2 font-medium";

    if (view === 'list') {
        const filtered = banks.filter(b => {
            if (!search) return true;
            return (b.bank_name || '').toLowerCase().includes(search.toLowerCase());
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Banks</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition" onClick={fetchBanks} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Bank
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-96 shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none placeholder:italic" placeholder="Search Bank Name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b text-gray-600 font-semibold">
                            <tr>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Bank Name</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">SWIFT</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Website</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="3" className="py-12 text-center text-gray-400 italic font-medium tracking-tight">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="py-20 text-center text-gray-500 italic font-medium tracking-tight">No banks found</td></tr>
                            ) : (
                                filtered.map((b) => (
                                    <tr key={b.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 font-bold text-blue-600 hover:text-blue-800 cursor-pointer uppercase" onClick={() => { setEditingRecord(b.name); setView('form'); }}>
                                            {b.bank_name}
                                        </td>
                                        <td className="px-5 py-4 text-xs font-medium text-gray-700 uppercase">{b.swift_number || '-'}</td>
                                        <td className="px-5 py-4 text-xs text-gray-400 lowercase">{b.website || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20 font-sans">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? editingRecord : 'New Bank'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition shadow-sm" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={handleDelete}>Delete</button>
                    )}
                    <button className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-100 disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 transition-all">
                {/* Bank Details Section */}
                <div className="p-8 pb-12 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm mb-6 uppercase tracking-wider">Bank Details</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Bank Name *</label>
                                <input 
                                    className={inputStyle} 
                                    value={formData.bank_name} 
                                    onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelStyle}>SWIFT number</label>
                                <input 
                                    className={inputStyle} 
                                    value={formData.swift_number} 
                                    onChange={e => setFormData({ ...formData, swift_number: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelStyle}>Website</label>
                            <input 
                                className={inputStyle} 
                                value={formData.website} 
                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Data Import Configuration Section */}
                <div className="border-b border-gray-100">
                    <button 
                        className="w-full px-8 py-4 flex justify-between items-center bg-gray-50/30 hover:bg-gray-50 transition"
                        onClick={() => setIsMappingOpen(!isMappingOpen)}
                    >
                        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Data Import Configuration</h3>
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isMappingOpen ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    
                    {isMappingOpen && (
                        <div className="p-8 space-y-6 bg-white animate-in slide-in-from-top-2 duration-200">
                            <h4 className="text-[13px] text-gray-500 font-medium">Bank Transaction Mapping</h4>
                            <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#F9FAFB] border-b text-gray-400 font-semibold uppercase text-[10px] tracking-widest">
                                        <tr>
                                            <th className="px-4 py-3 w-12 text-center">No.</th>
                                            <th className="px-4 py-3">Field in Bank Transaction *</th>
                                            <th className="px-4 py-3">Column in Bank File *</th>
                                            <th className="px-4 py-3 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 uppercase font-medium text-[12px]">
                                        {formData.bank_transaction_mapping.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="py-12 flex flex-col items-center justify-center text-gray-400 italic gap-2 text-center w-full min-h-[160px]">
                                                    <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    No Data
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.bank_transaction_mapping.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-center text-gray-400 font-black text-[11px]">{idx + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <input 
                                                            className="w-full border-none bg-transparent focus:outline-none font-bold" 
                                                            value={row.field_in_bank_transaction} 
                                                            onChange={e => updateRow(idx, 'field_in_bank_transaction', e.target.value)}
                                                            placeholder="e.g. Reference No..."
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input 
                                                            className="w-full border-none bg-transparent focus:outline-none font-bold" 
                                                            value={row.column_in_bank_file} 
                                                            onChange={e => updateRow(idx, 'column_in_bank_file', e.target.value)}
                                                            placeholder="e.g. Column B..."
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button className="text-gray-200 hover:text-red-500 transition-colors font-bold text-base px-2" onClick={() => {
                                                            const updated = formData.bank_transaction_mapping.filter((_, i) => i !== idx);
                                                            setFormData({ ...formData, bank_transaction_mapping: updated });
                                                        }}>✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button className="px-4 py-1.5 bg-gray-50 border border-gray-100 text-gray-700 text-[11px] font-black rounded hover:bg-gray-100 transition shadow-sm uppercase tracking-widest" onClick={addRow}>
                                Add Row
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Bank;
