import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { notification, Spin, Select } from 'antd';
import { FiRefreshCw, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

const parseServerMessage = (err) => {
    const serverMsg = err?.response?.data?._server_messages;
    if (!serverMsg) return err?.message || 'Request failed';
    try {
        const parsed = JSON.parse(serverMsg);
        return typeof parsed?.[0] === 'string' ? parsed[0] : 'Request failed';
    } catch {
        return err?.message || 'Request failed';
    }
};

/* ─── shared components ─── */
const InputField = ({ label, value, required = false, onChange, type = 'text', disabled = false }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <input
            type={type}
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-400 bg-white shadow-sm transition-colors'}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        />
    </div>
);

const SelectField = ({ label, value, required = false, onChange, options = [], disabled = false }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <select
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-400 bg-white shadow-sm transition-colors'}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        >
            <option value="">Select...</option>
            {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    </div>
);

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════ */
export default function StockReconciliation() {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState([]);
    const [editingRecord, setEditingRecord] = useState(null);

    const [formData, setFormData] = useState({
        naming_series: '',
        company: '',
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        set_posting_time: 0,
        purpose: 'Stock Reconciliation',
        set_warehouse: '',
        scan_barcode: '',
        scan_mode: 0,
        expense_account: '',
        cost_center: '',
        items: []
    });

    const [companies, setCompanies] = useState([]);
    const [itemsList, setItemsList] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [namingSeries, setNamingSeries] = useState([]);

    // ── Search/Filter masters ──
    const [itemSearch, setItemSearch] = useState('');
    const [whSearch, setWhSearch] = useState('');

    useEffect(() => {
        fetchData();
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [compRes, itemRes, whRes, accRes, ccRes, metaRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=100'),
                API.get('/api/resource/Item?fields=["name","item_name"]&limit_page_length=500'),
                API.get('/api/resource/Warehouse?fields=["name"]&limit_page_length=500'),
                API.get('/api/resource/Account?fields=["name","account_name"]&limit_page_length=500'),
                API.get('/api/resource/Cost Center?fields=["name","cost_center_name"]&limit_page_length=100'),
                API.get('/api/resource/DocType/Stock Reconciliation')
            ]);
            setCompanies(compRes.data?.data || []);
            setItemsList(itemRes.data?.data || []);
            setWarehouses(whRes.data?.data || []);
            setAccounts(accRes.data?.data || []);
            setCostCenters(ccRes.data?.data || []);
            
            // Extract naming series from doctype meta
            const namingSeriesField = metaRes.data?.data?.fields?.find(f => f.fieldname === 'naming_series');
            if (namingSeriesField && namingSeriesField.options) {
                setNamingSeries(namingSeriesField.options.split('\n').filter(Boolean));
            }
        } catch (err) {
            console.error('Failed to fetch masters:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Stock Reconciliation?fields=["name","company","posting_date","purpose","docstatus"]&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSingle = async (name) => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Stock Reconciliation/${encodeURIComponent(name)}`);
            setFormData(res.data?.data || {});
        } catch (err) {
            notification.error({ message: 'Failed to load details' });
        } finally {
            setLoading(false);
        }
    };

    const handleNew = () => {
        setEditingRecord(null);
        setFormData({
            naming_series: namingSeries[0] || '',
            company: companies[0]?.name || '',
            posting_date: new Date().toISOString().split('T')[0],
            posting_time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            set_posting_time: 0,
            purpose: 'Stock Reconciliation',
            set_warehouse: '',
            scan_barcode: '',
            scan_mode: 0,
            expense_account: '',
            cost_center: '',
            items: []
        });
        setView('form');
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        fetchSingle(record.name);
        setView('form');
    };

    const handleSave = async () => {
        if (!formData.company || formData.items.length === 0) {
            notification.warning({ message: 'Company and at least one item are required' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Stock Reconciliation/${encodeURIComponent(editingRecord.name)}`, formData);
                notification.success({ message: 'Updated successfully' });
            } else {
                await API.post('/api/resource/Stock Reconciliation', formData);
                notification.success({ message: 'Created successfully' });
            }
            setView('list');
            fetchData();
        } catch (err) {
            notification.error({ message: 'Save Failed', description: parseServerMessage(err) });
        } finally {
            setSaving(false);
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { item_code: '', warehouse: '', qty: 0, valuation_rate: 0 }]
        }));
    };

    const removeItem = (idx) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx)
        }));
    };

    const updateItem = (idx, field, val) => {
        const newItems = [...formData.items];
        newItems[idx] = { ...newItems[idx], [field]: val };
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    /* ═══════════ FORM VIEW ═══════════ */
    if (view === 'form') {
        const fetchItemsFromWarehouse = () => {
            notification.info({ message: 'Fetching items from warehouse not implemented in preview.' });
        };

        return (
            <div className="p-6 max-w-5xl mx-auto pb-24 text-gray-800">
                <style>{`
                    .custom-checkbox {
                        width: 14px;
                        height: 14px;
                        border-radius: 3px;
                        border: 1px solid #d1d5db;
                        cursor: pointer;
                    }
                    .custom-checkbox:checked {
                        background-color: #1C1F26;
                        border-color: #1C1F26;
                    }
                `}</style>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1" onClick={() => setView('list')}>
                            <FiChevronLeft size={24} />
                        </button>
                        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
                            {editingRecord ? editingRecord.name : 'New Stock Reconciliation'}
                        </h1>
                        {!editingRecord && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fdf2e9] text-[#e06c27] font-semibold tracking-wide uppercase">Not Saved</span>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        <button className="px-3 py-1.5 bg-gray-100/80 rounded text-[13px] font-medium text-gray-700 hover:bg-gray-200" onClick={fetchItemsFromWarehouse}>
                            Fetch Items from Warehouse
                        </button>
                        <button className="p-1.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 flex items-center justify-center">
                            <FiMoreHorizontal size={18} />
                        </button>
                        <button className="px-5 py-1.5 bg-[#1C1F26] text-white rounded text-[13px] font-semibold hover:bg-black transition-colors disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-[13px]">
                    <div className="p-8 pb-4">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {namingSeries.length > 0 && (
                                    <SelectField
                                        label="Series"
                                        value={formData.naming_series}
                                        required
                                        options={namingSeries.map(s => ({ value: s, label: s }))}
                                        onChange={(v) => setFormData(p => ({ ...p, naming_series: v }))}
                                    />
                                )}
                                <SelectField
                                    label="Company"
                                    value={formData.company}
                                    required
                                    options={companies.map(c => ({ value: c.name, label: c.name }))}
                                    onChange={(v) => setFormData(p => ({ ...p, company: v }))}
                                />
                                <SelectField
                                    label="Purpose"
                                    value={formData.purpose}
                                    required
                                    options={[
                                        { value: 'Stock Reconciliation', label: 'Stock Reconciliation' },
                                        { value: 'Opening Stock', label: 'Opening Stock' }
                                    ]}
                                    onChange={(v) => setFormData(p => ({ ...p, purpose: v }))}
                                />
                            </div>
                            
                            {/* Right Column */}
                            <div className="space-y-6">
                                <InputField
                                    label="Posting Date"
                                    type="date"
                                    value={formData.posting_date}
                                    required
                                    onChange={(v) => setFormData(p => ({ ...p, posting_date: v }))}
                                    disabled={!formData.set_posting_time}
                                />
                                <InputField
                                    label="Posting Time"
                                    type="time"
                                    value={formData.posting_time}
                                    required
                                    onChange={(v) => setFormData(p => ({ ...p, posting_time: v }))}
                                    disabled={!formData.set_posting_time}
                                />
                                <div className="flex items-center gap-2 pt-1">
                                    <input 
                                        type="checkbox" 
                                        className="w-3.5 h-3.5 text-gray-800 rounded border-gray-300 focus:ring-black"
                                        checked={!!formData.set_posting_time}
                                        onChange={e => setFormData(p => ({ ...p, set_posting_time: e.target.checked ? 1 : 0 }))}
                                    />
                                    <span className="text-[13px] text-gray-700 font-medium">Edit Posting Date and Time</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />
                    
                    <div className="p-8 py-6">
                        <div className="w-1/2 pr-6">
                            <SelectField
                                label="Default Warehouse"
                                value={formData.set_warehouse}
                                options={warehouses.map(w => ({ value: w.name, label: w.name }))}
                                onChange={(v) => setFormData(p => ({ ...p, set_warehouse: v }))}
                            />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="p-8 py-6">
                        <div className="grid grid-cols-2 gap-x-12">
                            <div>
                                <InputField
                                    label="Scan Barcode"
                                    value={formData.scan_barcode}
                                    onChange={(v) => setFormData(p => ({ ...p, scan_barcode: v }))}
                                />
                            </div>
                            <div className="pt-6">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        className="w-3.5 h-3.5 text-gray-800 rounded border-gray-300 focus:ring-black"
                                        checked={!!formData.scan_mode}
                                        onChange={e => setFormData(p => ({ ...p, scan_mode: e.target.checked ? 1 : 0 }))}
                                    />
                                    <span className="text-[13px] text-gray-800 font-bold bg-gray-100 px-1 rounded">Scan Mode</span>
                                </div>
                                <p className="text-[12px] text-gray-500 mt-1 ml-5">Disables auto-fetching of existing quantity</p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="p-8 py-6">
                        <h3 className="text-[13px] font-bold text-gray-500 mb-3 tracking-wide">Items</h3>
                        
                        <div className="border border-gray-100 rounded bg-[#fafafa]">
                            <table className="w-full text-left text-[13px]">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-4 py-2 text-center w-10">
                                            <input type="checkbox" className="custom-checkbox" />
                                        </th>
                                        <th className="py-2 text-gray-500 font-semibold w-12 text-center">No.</th>
                                        <th className="px-4 py-2 font-semibold text-gray-500">Item Code <span className="text-[#E02424]">*</span></th>
                                        <th className="px-4 py-2 font-semibold text-gray-500">Warehouse <span className="text-[#E02424]">*</span></th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 text-right w-32">Quantity</th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 text-right w-32">Valuation Rate</th>
                                        <th className="px-4 py-2 text-center w-10 text-gray-400">
                                            ⚙️
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-6 text-center text-gray-400 italic bg-white">No items added.</td>
                                        </tr>
                                    ) : (
                                        formData.items.map((item, idx) => (
                                            <tr key={idx} className="bg-white hover:bg-gray-50 border-b border-gray-50 last:border-0 relative group">
                                                <td className="px-4 py-2 text-center">
                                                    <input type="checkbox" className="custom-checkbox" />
                                                </td>
                                                <td className="py-2 text-gray-400 text-center font-mono">{idx + 1}</td>
                                                <td className="px-4 py-2 font-medium">
                                                    <Select
                                                        showSearch
                                                        className="w-full custom-select-borderless"
                                                        placeholder=""
                                                        value={item.item_code || undefined}
                                                        onChange={(v) => updateItem(idx, 'item_code', v)}
                                                        options={itemsList.map(i => ({ value: i.name, label: i.name }))}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-gray-600">
                                                    <Select
                                                        showSearch
                                                        className="w-full custom-select-borderless"
                                                        placeholder=""
                                                        value={item.warehouse || undefined}
                                                        onChange={(v) => updateItem(idx, 'warehouse', v)}
                                                        options={warehouses.map(w => ({ value: w.name, label: w.name }))}
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input type="number" className="w-full text-right bg-transparent border-none focus:ring-0 p-0 text-[13px]" value={item.qty} step="0.001" onChange={(e) => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)} />
                                                </td>
                                                <td className="px-4 py-2 text-right text-gray-600 flex items-center justify-end">
                                                    ₹ <input type="number" className="w-20 ml-1 text-right bg-transparent border-none focus:ring-0 p-0 text-[13px]" value={item.valuation_rate} step="0.01" onChange={(e) => updateItem(idx, 'valuation_rate', parseFloat(e.target.value) || 0)} />
                                                </td>
                                                <td className="px-4 py-2 text-center align-middle">
                                                    <button className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" onClick={() => removeItem(idx)}>
                                                        <FiTrash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 mb-2">
                            <button className="px-3 py-1 bg-gray-100 rounded text-gray-800 text-[12px] font-semibold hover:bg-gray-200" onClick={addItem}>
                                Add Row
                            </button>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-gray-50 border border-gray-200 rounded text-gray-600 text-[12px] font-semibold hover:bg-gray-100">
                                    Download
                                </button>
                                <button className="px-3 py-1 bg-gray-50 border border-gray-200 rounded text-gray-600 text-[12px] font-semibold hover:bg-gray-100">
                                    Upload
                                </button>
                            </div>
                        </div>

                        <div className="w-1/2 pr-6 mt-8">
                            <SelectField
                                label="Difference Account"
                                value={formData.expense_account}
                                options={accounts.map(a => ({ value: a.name, label: a.account_name || a.name }))}
                                onChange={(v) => setFormData(p => ({ ...p, expense_account: v }))}
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 px-8 py-5 border-t border-gray-100">
                        <h3 className="text-[14px] font-bold text-gray-800 mb-4">Accounting Dimensions</h3>
                        <div className="w-1/2 pr-6">
                            <SelectField
                                label="Cost Center"
                                value={formData.cost_center}
                                options={costCenters.map(c => ({ value: c.name, label: c.name }))}
                                onChange={(v) => setFormData(p => ({ ...p, cost_center: v }))}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ═══════════ LIST VIEW ═══════════ */
    return (
        <div className="p-6 max-w-[1200px] mx-auto text-gray-800">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Stock Reconciliation</h1>
                    <p className="text-sm text-gray-500 mt-1">Adjust stock levels and valuation rates.</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-all text-gray-600" onClick={fetchData} disabled={loading}>
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </button>
                    <button className="px-4 py-2 bg-[#1C1F26] text-white rounded text-sm font-semibold hover:bg-black transition-all flex items-center gap-2 shadow-sm" onClick={handleNew}>
                        <FiPlus size={16} /> Add Stock Reconciliation
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Posting Date</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Company</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Purpose</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Status</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">Loading data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No records found.</td></tr>
                            ) : (
                                data.map((row) => (
                                    <tr key={row.name} className="hover:bg-blue-50/30 group transition-colors cursor-pointer" onClick={() => handleEdit(row)}>
                                        <td className="px-6 py-4 font-bold text-blue-600 tracking-tight">{row.name}</td>
                                        <td className="px-6 py-4 text-gray-700">{row.posting_date}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.company}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.purpose}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${row.docstatus === 1 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {row.docstatus === 1 ? 'Submitted' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                                                <FiEdit2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .custom-select-borderless .ant-select-selector {
                    border: none !important;
                    background: transparent !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    font-size: 13px !important;
                    color: #374151 !important;
                }
                .custom-select-borderless .ant-select-selection-placeholder {
                    padding: 0 !important;
                }
            `}</style>
        </div>
    );
}
