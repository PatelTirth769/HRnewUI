import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification } from 'antd';
import { FiEdit2, FiTrash2, FiMapPin } from 'react-icons/fi';

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = false, colSpan = 1, placeholder = "" }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <input
            type={type}
            placeholder={placeholder}
            className={`w-full border border-gray-100 rounded bg-[#fcfcfc] px-3 py-2 text-[13px] focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 hover:border-gray-300 transition-colors'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const SelectField = ({ label, value, options, required = false, onChange, disabled = false, colSpan = 1 }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <select
            className={`w-full border border-gray-100 rounded bg-[#fcfcfc] px-3 py-2 text-[13px] focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 hover:border-gray-300 transition-colors'}`}
            value={value || ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            disabled={disabled}
        >
            <option value=""></option>
            {options.map((opt, i) => (
                <option key={i} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                </option>
            ))}
        </select>
    </div>
);

const CheckboxField = ({ label, subLabel, checked, onChange, disabled = false, colSpan = 1 }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
        <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 font-medium">
            <input
                type="checkbox"
                className="rounded border-gray-300 text-gray-800 focus:ring-gray-800 w-4 h-4 bg-[#fcfcfc]"
                checked={checked || false}
                onChange={(e) => onChange && onChange(e.target.checked)}
                disabled={disabled}
            />
            {label}
        </label>
        {subLabel && <p className="text-[12px] text-gray-400 ml-6 mt-1">{subLabel}</p>}
    </div>
);

const Location = () => {
    const [view, setView] = useState('list'); // 'list' | 'form'
    const [locations, setLocations] = useState([]);
    const [parentOptions, setParentOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        location_name: '',
        parent_location: '',
        is_container: 0,
        is_group: 0,
        latitude: '',
        longitude: ''
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        if (view === 'list') {
            fetchLocations();
        } else {
            fetchParentOptions();
        }
    }, [view]);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Location?fields=["name","location_name","parent_location","is_group"]&limit_page_length=None');
            setLocations(res.data.data || []);
        } catch (err) {
            console.error('Error fetching locations', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchParentOptions = async () => {
        try {
            // ERPNext Parent Location usually must be an Is Group location
            const res = await API.get('/api/resource/Location?fields=["name"]&filters=[["is_group","=",1]]&limit_page_length=None');
            setParentOptions((res.data.data || []).map(l => l.name));
        } catch (err) {
            console.error('Error fetching parent locations', err);
        }
    };

    const handleCreateNew = () => {
        setFormData({
            location_name: '',
            parent_location: '',
            is_container: 0,
            is_group: 0,
            latitude: '',
            longitude: ''
        });
        setIsEditing(false);
        setEditId(null);
        setView('form');
    };

    const handleEdit = async (id) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Location/${encodeURIComponent(id)}`);
            setFormData({
                ...res.data.data,
                is_container: res.data.data.is_container || 0,
                is_group: res.data.data.is_group || 0
            });
            setIsEditing(true);
            setEditId(id);
            setView('form');
        } catch (err) {
            console.error('Error fetching location', err);
            notification.error({ message: 'Failed to fetch location data' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete location ${id}?`)) return;
        try {
            await API.delete(`/api/resource/Location/${encodeURIComponent(id)}`);
            notification.success({ message: 'Location deleted successfully!' });
            fetchLocations();
        } catch (err) {
            console.error('Error deleting location', err);
            notification.error({ message: 'Failed to delete location' });
        }
    };

    const handleSave = async () => {
        if (!formData.location_name) {
            notification.warning({ message: 'Location Name is required' });
            return;
        }
        
        try {
            setLoading(true);
            if (isEditing) {
                await API.put(`/api/resource/Location/${encodeURIComponent(editId)}`, formData);
                notification.success({ message: 'Location updated successfully!' });
            } else {
                await API.post('/api/resource/Location', formData);
                notification.success({ message: 'Location created successfully!' });
            }
            setView('list');
        } catch (err) {
            console.error('Error saving location', err);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try {
                    const parsed = JSON.parse(errMsg);
                    errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n');
                } catch { /* */ }
            }
            notification.error({ message: 'Failed to save location', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) });
        } finally {
            setLoading(false);
        }
    };

    if (view === 'form') {
        return (
            <div className="p-6 max-w-5xl mx-auto font-sans bg-[#F4F5F6] min-h-screen">
                <div className="flex justify-between items-start mb-6 pb-2">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-800 pt-1" onClick={() => setView('list')} disabled={loading}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            {isEditing ? `Edit Location: ${editId}` : 'New Location'}
                            <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold align-middle ml-2">Not Saved</span>
                        </h1>
                    </div>
                    <div>
                        <button className="px-4 py-1.5 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-70 flex items-center gap-2 shadow-sm" onClick={handleSave} disabled={loading}>
                            {loading ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-8">
                        {/* Section 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-8">
                            <div className="space-y-6">
                                <InputField label="Location Name" required value={formData.location_name} onChange={(v) => setFormData({ ...formData, location_name: v })} disabled={loading} />
                                <SelectField label="Parent Location" options={parentOptions} value={formData.parent_location} onChange={(v) => setFormData({ ...formData, parent_location: v })} disabled={loading} />
                            </div>
                            <div className="space-y-6 pt-1">
                                <CheckboxField label="Is Container" subLabel="Check if it is a hydroponic unit" checked={formData.is_container === 1} onChange={(v) => setFormData({ ...formData, is_container: v ? 1 : 0 })} disabled={loading} />
                                <CheckboxField label="Is Group" checked={formData.is_group === 1} onChange={(v) => setFormData({ ...formData, is_group: v ? 1 : 0 })} disabled={loading} />
                            </div>
                        </div>

                        {/* Location Details */}
                        <hr className="border-gray-100 -mx-8 mb-8" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-6">Location Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-8">
                            <div className="space-y-6">
                                <InputField label="Latitude" value={formData.latitude} onChange={(v) => setFormData({ ...formData, latitude: v })} disabled={loading} />
                                <InputField label="Longitude" value={formData.longitude} onChange={(v) => setFormData({ ...formData, longitude: v })} disabled={loading} />
                            </div>
                            <div></div>
                        </div>

                        {/* Location Map Placeholder */}
                        <hr className="border-gray-100 -mx-8 mb-8" />
                        <h3 className="font-semibold text-gray-800 text-[13px] mb-3">Location</h3>
                        <div className="w-full h-[300px] bg-[#E5E7EB] border border-gray-200 rounded flex flex-col items-center justify-center text-gray-400">
                            <FiMapPin className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm font-medium">Map View</p>
                            <p className="text-xs mt-1">(Coordinates: {formData.latitude || 'N/A'}, {formData.longitude || 'N/A'})</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Locations</h1>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2" onClick={fetchLocations}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm" onClick={handleCreateNew}>
                        <span>+</span> Add Location
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px] sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Location Name</th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Parent Location</th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Is Group</th>
                                <th className="px-4 py-3 font-medium w-24 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : locations.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-12">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="w-12 h-12 mx-auto stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                        </div>
                                        <p className="text-gray-500 text-base">No Locations Found</p>
                                    </td>
                                </tr>
                            ) : (
                                locations.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/80 cursor-pointer transition-colors" onClick={() => handleEdit(row.name)}>
                                        <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.parent_location || '-'}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.is_group ? 'Yes' : 'No'}</td>
                                        <td className="px-4 py-2.5 text-center flex justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                                            <button className="text-blue-500 hover:text-blue-700" onClick={() => handleEdit(row.name)}><FiEdit2 /></button>
                                            <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(row.name)}><FiTrash2 /></button>
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
};

export default Location;
