import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin, Select, Input, Table, Checkbox, Button, Dropdown } from 'antd';
import { FiChevronLeft, FiPlus, FiRefreshCw, FiMoreHorizontal, FiFilter, FiChevronDown } from 'react-icons/fi';
import API from '../../services/api';

const InputField = ({ label, value, required = false, onChange, type = 'text', disabled = false }) => (
    <div className="mb-6">
        <label className="block text-[13px] text-gray-500 mb-1.5 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <Input
            type={type}
            className={`h-10 rounded-lg border-gray-200 hover:border-gray-300 focus:border-black shadow-sm ${disabled ? 'bg-gray-50' : ''}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const SearchableSelect = ({ label, value, options, required = false, onChange, placeholder }) => (
    <div className="mb-6">
        <label className="block text-[13px] text-gray-500 mb-1.5 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <Select
            showSearch
            className="w-full h-10 custom-uom-select"
            placeholder={placeholder}
            optionFilterProp="children"
            value={value || undefined}
            onChange={onChange}
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={options.map(opt => ({ label: opt.uom_name || opt.name, value: opt.name }))}
        />
    </div>
);

export default function UOMConversionFactor() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    
    // Filters
    const [filters, setFilters] = useState({ id: '', category: '', from: '', to: '' });

    // Master data
    const [categories, setCategories] = useState([]);
    const [uoms, setUoms] = useState([]);

    const [formData, setFormData] = useState({ category: '', from_uom: '', to_uom: '', value: 0 });

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        } else {
            fetchMasters();
            if (editingRecord) {
                fetchSingle(editingRecord.name);
            } else {
                setFormData({ category: '', from_uom: '', to_uom: '', value: 0 });
            }
        }
    }, [view, editingRecord]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/UOM Conversion Factor?fields=["name","category","from_uom","to_uom","value","modified"]&limit_page_length=500&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch UOM Conversions failed:', err);
            notification.error({ message: 'Failed to load Conversion Factors' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [catRes, uomRes] = await Promise.all([
                API.get('/api/resource/UOM Category/?fields=["name"]&limit_page_length=500'),
                API.get('/api/resource/UOM/?fields=["name","uom_name"]&limit_page_length=500')
            ]);
            setCategories(catRes.data.data || []);
            setUoms(uomRes.data.data || []);
        } catch (err) {
            console.error('Fetch Masters failed:', err);
        }
    };

    const fetchSingle = async (name) => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/UOM Conversion Factor/${encodeURIComponent(name)}`);
            if (res.data?.data) {
                setFormData(res.data.data);
            }
        } catch (err) {
            console.error('Fetch single failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ category: '', from_uom: '', to_uom: '', value: 0 });
        setView('form');
    };

    const handleSave = async () => {
        if (!formData.category || !formData.from_uom || !formData.to_uom) {
            notification.warning({ message: 'Please fill all required fields' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/UOM Conversion Factor/${encodeURIComponent(editingRecord.name)}`, formData);
                notification.success({ message: `Record updated successfully!` });
            } else {
                await API.post('/api/resource/UOM Conversion Factor', formData);
                notification.success({ message: `Record created successfully!` });
            }
            setView('list');
            setEditingRecord(null);
        } catch (err) {
            console.error('Save failed:', err);
            notification.error({ message: 'Save Failed', description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Delete record ${record.name}?`)) return;
        try {
            await API.delete(`/api/resource/UOM Conversion Factor/${encodeURIComponent(record.name)}`);
            notification.success({ message: `Deleted successfully!` });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed' });
        }
    };

    const filteredData = useMemo(() => {
        return data.filter(d => 
            (d.name || '').toLowerCase().includes(filters.id.toLowerCase()) &&
            (d.category || '').toLowerCase().includes(filters.category.toLowerCase()) &&
            (d.from_uom || '').toLowerCase().includes(filters.from.toLowerCase()) &&
            (d.to_uom || '').toLowerCase().includes(filters.to.toLowerCase())
        );
    }, [data, filters]);

    const columns = [
        {
            title: ({}) => <Checkbox disabled className="ml-1" />,
            dataIndex: 'selection',
            key: 'selection',
            width: 50,
            render: () => <Checkbox className="ml-1" />
        },
        {
            title: 'ID',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span className="font-bold text-gray-900">{text}</span>
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (text) => <span className="text-gray-600">{text}</span>
        },
        {
            title: 'From',
            dataIndex: 'from_uom',
            key: 'from_uom',
            render: (text) => <span className="text-gray-600 font-medium">{text}</span>
        },
        {
            title: 'To',
            dataIndex: 'to_uom',
            key: 'to_uom',
            render: (text) => <span className="text-gray-600 font-medium">{text}</span>
        },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            render: (text) => <span className="font-mono text-gray-500">{text}</span>
        },
        {
            title: 'Modified',
            dataIndex: 'modified',
            key: 'modified',
            width: 100,
            render: (text) => <span className="text-gray-400 text-xs">1y</span> // Mocking the "1y" as in screenshot
        },
        {
            title: '',
            key: 'action',
            width: 80,
            render: (_, record) => (
                <div className="flex gap-3 justify-end pr-4 text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </div>
            )
        }
    ];

    if (view === 'form') {
        return (
            <div className="min-h-screen bg-white">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-30">
                    <div className="flex items-center gap-4">
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400" onClick={() => setView('list')}>
                            <FiChevronLeft size={22} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            {editingRecord ? editingRecord.name : 'New UOM Conversion Factor'}
                        </h1>
                        {!editingRecord && (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-orange-50 text-orange-600 border border-orange-100">Not Saved</span>
                        )}
                    </div>
                    <button 
                        className="px-6 py-1.5 bg-[#1C1F26] text-white rounded text-sm font-bold hover:bg-black transition shadow-sm disabled:opacity-50" 
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>

                <div className="p-8 max-w-7xl mx-auto">
                    <Spin spinning={loading}>
                        <div className="bg-white rounded-xl border border-gray-200 p-10 shadow-sm animate-fade-in">
                            <div className="max-w-4xl space-y-2">
                                <SearchableSelect
                                    label="Category"
                                    value={formData.category}
                                    options={categories}
                                    required
                                    placeholder="Select Category"
                                    onChange={(v) => setFormData(p => ({ ...p, category: v }))}
                                />
                                <SearchableSelect
                                    label="From"
                                    value={formData.from_uom}
                                    options={uoms}
                                    required
                                    placeholder="Select From UOM"
                                    onChange={(v) => setFormData(p => ({ ...p, from_uom: v }))}
                                />
                                <SearchableSelect
                                    label="To"
                                    value={formData.to_uom}
                                    options={uoms}
                                    required
                                    placeholder="Select To UOM"
                                    onChange={(v) => setFormData(p => ({ ...p, to_uom: v }))}
                                />
                                <div className="max-w-xs">
                                    <InputField
                                        label="Value"
                                        type="number"
                                        value={formData.value}
                                        required
                                        onChange={(v) => setFormData(p => ({ ...p, value: v }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </Spin>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA]">
            {/* Header matching Screenshot 1 */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">UOM Conversion Factor</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Dropdown menu={{ items: [{ key: 'list', label: 'List View' }] }} trigger={['click']}>
                        <Button className="h-8 text-xs font-bold border-none bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
                           <FiFilter /> List View <FiChevronDown />
                        </Button>
                    </Dropdown>
                    <Button icon={<FiRefreshCw />} className="h-8 w-8 flex items-center justify-center border-none bg-gray-100 hover:bg-gray-200" onClick={fetchData} />
                    <Button icon={<FiMoreHorizontal />} className="h-8 w-8 flex items-center justify-center border-none bg-gray-100 hover:bg-gray-200" />
                    <button 
                        className="px-4 py-1.5 bg-[#1C1F26] text-white rounded text-xs font-bold hover:bg-black transition flex items-center gap-2"
                        onClick={handleNew}
                    >
                        <FiPlus /> Add UOM Conversion Factor
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-[1500px] mx-auto pb-24">
                {/* Filter Bar matching Screenshot 1 */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6 animate-fade-in">
                    <div className="grid grid-cols-5 gap-3 p-4 bg-gray-50/30">
                        <Input 
                            placeholder="ID" className="h-9 text-xs bg-gray-50 border-none rounded-lg" 
                            value={filters.id} onChange={e => setFilters(p => ({ ...p, id: e.target.value }))}
                        />
                        <Input 
                            placeholder="Category" className="h-9 text-xs bg-gray-50 border-none rounded-lg" 
                            value={filters.category} onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}
                        />
                        <Input 
                            placeholder="From" className="h-9 text-xs bg-gray-50 border-none rounded-lg" 
                            value={filters.from} onChange={e => setFilters(p => ({ ...p, from: e.target.value }))}
                        />
                        <Input 
                            placeholder="To" className="h-9 text-xs bg-gray-50 border-none rounded-lg" 
                            value={filters.to} onChange={e => setFilters(p => ({ ...p, to: e.target.value }))}
                        />
                        <div className="flex gap-2">
                            <Button className="h-9 flex-1 bg-gray-100 border-none rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-gray-500">
                                <FiFilter /> Filter <span className="opacity-0">×</span>
                            </Button>
                            <Button className="h-9 px-4 bg-gray-100 border-none rounded-lg text-xs font-bold text-gray-500">
                                Last Updated On
                            </Button>
                        </div>
                    </div>

                    <Table 
                        dataSource={filteredData} 
                        columns={columns} 
                        pagination={{ pageSize: 20 }}
                        className="custom-uom-list-table"
                        onRow={(record) => ({
                            onClick: () => { setEditingRecord(record); setView('form'); }
                        })}
                        rowKey="name"
                        loading={loading}
                    />
                </div>
            </div>

            <style jsx global>{`
                .custom-uom-list-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    color: #94a3b8 !important;
                    padding: 12px 20px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
                .custom-uom-list-table .ant-table-tbody > tr > td {
                    padding: 10px 20px !important;
                    border-bottom: 1px solid #f8fafc !important;
                    cursor: pointer;
                }
                .custom-uom-list-table .ant-table-row:hover > td {
                    background: #f1f5f9/50 !important;
                }
                .custom-uom-select .ant-select-selector {
                    border-radius: 8px !important;
                    border-color: #e5e7eb !important;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
                }
                .custom-uom-select .ant-select-selector:hover {
                    border-color: #d1d5db !important;
                }
                .custom-uom-select.ant-select-focused .ant-select-selector {
                    border-color: #000 !important;
                    box-shadow: none !important;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
