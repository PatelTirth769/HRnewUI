import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import { Modal, message, Spin, Tabs } from 'antd';

const DeliveryTrip = () => {
    const API_URL = '/api/resource/Delivery Trip';
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [search, setSearch] = useState('');

    const initialFormState = {
        naming_series: 'MAT-DT-.YYYY.-',
        company: 'Ketty Apparels',
        email_notification_sent: 0,
        driver: '',
        vehicle: '',
        driver_address: '',
        departure_time: '',
        delivery_stops: [],
        status: 'Draft'
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (view === 'list') fetchRecords();
    }, [view]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const response = await API.get(`${API_URL}?fields=["name","company","driver","status","departure_time"]&order_by=creation desc`);
            setRecords(response.data.data || []);
        } catch (error) {
            message.error('Failed to fetch records');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (name) => {
        setLoading(true);
        try {
            const response = await API.get(`${API_URL}/${name}`);
            setFormData(response.data.data);
            setCurrentRecord(name);
            setView('form');
        } catch (error) {
            message.error('Failed to fetch details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (currentRecord) {
                await API.put(`${API_URL}/${currentRecord}`, formData);
                message.success('Updated successfully');
            } else {
                await API.post(API_URL, formData);
                message.success('Created successfully');
            }
            setView('list');
        } catch (error) {
            message.error('Failed to save record');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (name) => {
        Modal.confirm({
            title: 'Delete Delivery Trip?',
            content: `Are you sure you want to delete ${name}?`,
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await API.delete(`${API_URL}/${name}`);
                    message.success('Deleted successfully');
                    fetchRecords();
                } catch (error) {
                    message.error('Failed to delete record');
                }
            }
        });
    };

    const addStopRow = () => {
        setFormData({
            ...formData,
            delivery_stops: [...(formData.delivery_stops || []), { customer: '', address: '', locked: 0, delivery_note: '', estimated_arrival: '' }]
        });
    };

    const lbl = "block text-[13px] text-gray-500 mb-1 font-medium";
    const inp = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const sec = "font-semibold text-gray-800 text-sm mb-4 mt-8 pb-2 border-b flex items-center gap-2";
    const th = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const ri = "w-full border border-gray-100 rounded bg-transparent py-1 px-2 text-sm focus:ring-1 focus:ring-blue-400 focus:bg-white focus:border-blue-400 transition-colors";

    if (view === 'list') {
        return (
            <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold">Delivery Trips</h1>
                    <button
                        onClick={() => { setFormData(initialFormState); setCurrentRecord(null); setView('form'); }}
                        className="bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        + New Delivery Trip
                    </button>
                </div>

                <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-sm">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <input
                            className="w-full max-w-md border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                            placeholder="Search by name, driver..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Spin spinning={loading}>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Name', 'Company', 'Driver', 'Departure Time', 'Status', ''].map(h => <th key={h} className={th}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()) || (r.driver || '').toLowerCase().includes(search.toLowerCase())).map((r) => (
                                    <tr key={r.name} className="hover:bg-blue-50/30 cursor-pointer transition-colors group" onClick={() => handleEdit(r.name)}>
                                        <td className="px-4 py-3 font-medium text-blue-600">{r.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{r.company}</td>
                                        <td className="px-4 py-3 text-gray-600">{r.driver}</td>
                                        <td className="px-4 py-3 text-gray-600">{r.departure_time}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                r.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                r.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(r.name); }} className="text-gray-400 hover:text-red-500 transition-colors">
                                                <FiTrash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Spin>
                </div>
            </div>
        );
    }

    const tabItems = [
        {
            key: 'details',
            label: 'Details',
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div>
                                <label className={lbl}>Series</label>
                                <select className={inp} value={formData.naming_series} onChange={e => setFormData({...formData, naming_series: e.target.value})}>
                                    <option value="MAT-DT-.YYYY.-">MAT-DT-.YYYY.-</option>
                                </select>
                            </div>
                            <div>
                                <label className={lbl}>Company *</label>
                                <input className={inp} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="pt-6">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.email_notification_sent} onChange={e => setFormData({...formData, email_notification_sent: e.target.checked ? 1 : 0})} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5" />
                                    <span className="text-sm font-semibold text-gray-700">Initial Email Notification Sent</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className={sec + " mt-8"}>Delivery Details</div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div>
                                <label className={lbl}>Driver</label>
                                <input className={inp} value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})} />
                            </div>
                            <div>
                                <label className={lbl}>Driver Address</label>
                                <input className={inp} value={formData.driver_address} onChange={e => setFormData({...formData, driver_address: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className={lbl}>Vehicle *</label>
                                <input className={inp} value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})} />
                            </div>
                            <div>
                                <label className={lbl}>Departure Time *</label>
                                <input type="datetime-local" className={inp} value={formData.departure_time} onChange={e => setFormData({...formData, departure_time: e.target.value})} />
                                <p className="text-[10px] text-gray-400 mt-1">Asia/Kolkata</p>
                            </div>
                        </div>
                    </div>

                    <div className={sec + " mt-8"}>Delivery Stops</div>
                    <p className="text-xs text-gray-500 -mt-2 mb-2 font-medium">Delivery Stop</p>
                    <div className="border border-gray-200 rounded overflow-hidden text-xs bg-gray-50">
                        <table className="w-full text-left">
                            <thead className="bg-[#f8f9fa] border-b border-gray-100">
                                <tr>
                                    <th className="w-8 !px-2 !py-2 text-center text-gray-400"><input type="checkbox" disabled /></th>
                                    <th className="!px-4 !py-2 !font-semibold !text-gray-500 w-12 text-center">No.</th>
                                    <th className="!px-4 !py-2 !font-semibold !text-gray-500">Customer</th>
                                    <th className="!px-4 !py-2 !font-semibold !text-gray-500">Address Name *</th>
                                    <th className="!px-4 !py-2 !font-semibold !text-gray-500 w-16 text-center">Locked</th>
                                    <th className="!px-4 !py-2 !font-semibold !text-gray-500">Delivery Note</th>
                                    <th className="!px-4 !py-2 !font-semibold !text-gray-500">Estimated Arrival</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {(formData.delivery_stops || []).length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 8h6M9 12h6M9 16h2"/></svg>
                                                <span>No Data</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    (formData.delivery_stops || []).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 group">
                                            <td className="w-8 px-2 py-2 text-center"><input type="checkbox" /></td>
                                            <td className="px-4 py-2 text-center text-gray-400">{i + 1}</td>
                                            <td className="px-4 py-2">
                                                <input className={ri} value={row.customer || ''} onChange={e => {
                                                    const nl = [...formData.delivery_stops]; nl[i] = {...nl[i], customer: e.target.value}; setFormData({...formData, delivery_stops: nl});
                                                }} />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input className={ri} value={row.address || ''} onChange={e => {
                                                    const nl = [...formData.delivery_stops]; nl[i] = {...nl[i], address: e.target.value}; setFormData({...formData, delivery_stops: nl});
                                                }} />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <input type="checkbox" checked={!!row.locked} onChange={e => {
                                                    const nl = [...formData.delivery_stops]; nl[i] = {...nl[i], locked: e.target.checked ? 1 : 0}; setFormData({...formData, delivery_stops: nl});
                                                }} />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input className={ri} value={row.delivery_note || ''} onChange={e => {
                                                    const nl = [...formData.delivery_stops]; nl[i] = {...nl[i], delivery_note: e.target.value}; setFormData({...formData, delivery_stops: nl});
                                                }} />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input type="datetime-local" className={ri} value={row.estimated_arrival || ''} onChange={e => {
                                                    const nl = [...formData.delivery_stops]; nl[i] = {...nl[i], estimated_arrival: e.target.value}; setFormData({...formData, delivery_stops: nl});
                                                }} />
                                            </td>
                                            <td className="px-4 py-2 text-center text-red-400 hover:text-red-600 cursor-pointer" onClick={() => {
                                                const nl = [...formData.delivery_stops]; nl.splice(i,1); setFormData({...formData, delivery_stops: nl});
                                            }}>✕</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="p-3 bg-white border-t flex">
                            <button onClick={addStopRow} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition border">Add Row</button>
                        </div>
                    </div>

                    <div className={sec + " mt-8"}>Status</div>
                    <div className="grid grid-cols-2 gap-x-12">
                        <div>
                            <label className={lbl}>Status</label>
                            <input className={inp + " disabled:bg-gray-50"} value={formData.status} disabled />
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className="text-gray-500 hover:text-black transition-colors">
                        <FiArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold">{currentRecord || 'New Delivery Trip'}</h1>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">{currentRecord ? formData.status : 'Draft'}</span>
                    {!currentRecord && (
                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-semibold">Not Saved</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleSave} disabled={saving} className="bg-black text-white px-6 py-2 rounded text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                        {saving ? <Spin size="small" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm p-8">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Tabs defaultActiveKey="details" items={tabItems} className="custom-tabs" />
                )}
            </div>

            <style>{`
                .custom-tabs .ant-tabs-nav {
                    margin-bottom: 24px !important;
                }
                .custom-tabs .ant-tabs-tab {
                    padding: 8px 0 16px 0 !important;
                    margin: 0 40px 0 0 !important;
                    font-size: 14px !important;
                    color: #6b7280 !important;
                }
                .custom-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #111827 !important;
                    font-weight: 600 !important;
                }
                .custom-tabs .ant-tabs-ink-bar {
                    background: #111827 !important;
                    height: 2px !important;
                }
            `}</style>
        </div>
    );
};

export default DeliveryTrip;
