import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    room_name: '',
    room_number: '',
    seating_capacity: 0,
});

const Room = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [rooms, setRooms] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (view === 'list') {
            fetchRooms();
        } else {
            if (editingRecord) {
                fetchRoom(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchRooms = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Room?fields=["name","room_number","seating_capacity"]&limit_page_length=None&order_by=name asc';
            const response = await API.get(url);
            setRooms(response.data.data || []);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchRoom = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Room/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                room_name: d.name || '',
                room_number: d.room_number || '',
                seating_capacity: d.seating_capacity || 0,
            });
        } catch (err) {
            console.error('Error fetching room:', err);
            notification.error({ message: 'Error', description: 'Failed to load room data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!form.room_name) {
            notification.warning({ message: 'Room Name is required.' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                room_name: form.room_name,
                room_number: form.room_number || null,
                seating_capacity: parseInt(form.seating_capacity) || 0,
            };

            if (editingRecord) {
                await API.put(`/api/resource/Room/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Room updated successfully.' });
            } else {
                await API.post('/api/resource/Room', payload);
                notification.success({ message: 'Room created successfully.' });
            }
            setView('list');
        } catch (err) {
            console.error('Save error:', err);
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this room?')) return;
        try {
            await API.delete(`/api/resource/Room/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Room deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = rooms.filter(r => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (r.name || '').toLowerCase().includes(q) ||
                (r.room_number || '').toLowerCase().includes(q)
            );
        });

        const hasActiveFilters = !!search;
        const clearFilters = () => setSearch('');

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Room</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchRooms} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Room
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Room Name or Number..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {hasActiveFilters && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={clearFilters}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {rooms.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600">Room Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Room Number</th>
                                <th className="px-4 py-3 font-medium text-gray-600 text-center">Capacity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1">No Rooms Found</p>
                                        <p className="text-sm text-gray-400">Try adjusting your search or add a new room.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.room_number || '-'}</td>
                                        <td className="px-4 py-3 text-center text-gray-600 font-mono">{row.seating_capacity || 0}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading room data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord : 'New Room'}</span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={handleDelete}>Delete</button>
                    )}
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                <div className="grid grid-cols-1 gap-6 max-w-2xl">
                    <div>
                        <label className={labelStyle}>Room Name *</label>
                        <input type="text" className={inputStyle} value={form.room_name} onChange={e => updateField('room_name', e.target.value)} placeholder="e.g. Physics Lab" />
                    </div>
                    <div>
                        <label className={labelStyle}>Room Number</label>
                        <input type="text" className={inputStyle} value={form.room_number} onChange={e => updateField('room_number', e.target.value)} placeholder="e.g. LAB-101" />
                    </div>
                    <div>
                        <label className={labelStyle}>Seating Capacity</label>
                        <input type="number" className={inputStyle} value={form.seating_capacity} onChange={e => updateField('seating_capacity', e.target.value)} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Room;
