import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const TaxCategory = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [formData, setFormData] = useState({ title: '', disabled: 0 });

    useEffect(() => {
        if (view === 'list') {
            fetchCategories();
        }
    }, [view]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Tax Category?fields=["name","title","disabled"]');
            setCategories(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch tax categories' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Tax Category/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
            setEditingRecord(name);
            setView('form');
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch category details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title) {
            notification.warning({ message: 'Validation', description: 'Title is required' });
            return;
        }
        try {
            setSaving(true);
            if (editingRecord) {
                await API.put(`/api/resource/Tax Category/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Success', description: 'Tax Category updated' });
            } else {
                await API.post('/api/resource/Tax Category', formData);
                notification.success({ message: 'Success', description: 'Tax Category created' });
            }
            setView('list');
            setFormData({ title: '', disabled: 0 });
            setEditingRecord(null);
        } catch (err) {
            notification.error({ message: 'Error', description: err.response?.data?._server_messages || 'Failed to save tax category' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (name) => {
        if (!window.confirm('Are you sure you want to delete this tax category?')) return;
        try {
            await API.delete(`/api/resource/Tax Category/${encodeURIComponent(name)}`);
            notification.success({ message: 'Success', description: 'Tax Category deleted' });
            fetchCategories();
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to delete tax category' });
        }
    };

    if (view === 'list') {
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition shadow-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Tax Categories</h1>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium shadow-sm" onClick={() => { setFormData({ title: '', disabled: 0 }); setEditingRecord(null); setView('form'); }}>
                        + New Category
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-[#F8F9FA] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="3" className="py-12 text-center text-gray-400 italic font-medium"><Spin /></td></tr>
                            ) : categories.length === 0 ? (
                                <tr><td colSpan="3" className="py-20 text-center text-gray-400 italic font-medium tracking-tight">No tax categories defined yet</td></tr>
                            ) : (
                                categories.map((cat) => (
                                    <tr key={cat.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleEdit(cat.name)} className="text-gray-800 font-bold hover:text-blue-600 transition-colors">
                                                {cat.title || cat.name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${!cat.disabled ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                {cat.disabled ? 'Disabled' : 'Enabled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDelete(cat.name)} className="text-gray-300 hover:text-red-500 transition-colors p-2" title="Delete Category">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
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
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? editingRecord : 'New Tax Category'}
                    </h2>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-black border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-md hover:bg-gray-50 transition shadow-sm font-medium" onClick={() => setView('list')}>Cancel</button>
                    <button className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition font-bold shadow-lg shadow-gray-200 disabled:opacity-50 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <Spin size="small" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 p-10 space-y-12">
                <div className="space-y-8">
                    <div className="relative group">
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 group-focus-within:text-blue-600 transition-colors">Title *</label>
                        <input
                            className="w-full text-lg border-b-2 border-gray-100 pb-3 focus:outline-none focus:border-blue-600 transition-all font-bold placeholder:text-gray-200"
                            placeholder="e.g. In-State, Export, etc."
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                        <input
                            type="checkbox"
                            id="disabled-toggle"
                            className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 transition cursor-pointer"
                            checked={!!formData.disabled}
                            onChange={(e) => setFormData({ ...formData, disabled: e.target.checked ? 1 : 0 })}
                        />
                        <label htmlFor="disabled-toggle" className="flex-1 cursor-pointer font-bold text-gray-700 group-hover:text-red-600 transition-colors py-2 text-sm">
                            Disabled
                            <span className="block text-[11px] font-normal text-gray-400 mt-1 uppercase tracking-tight">Temporarily deactivate this category</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxCategory;
