import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
    FiSearch, FiFilter, FiPlus, FiMoreVertical, FiSave, FiTrash2, 
    FiArrowLeft, FiChevronLeft, FiChevronDown, FiInfo, FiLayers, FiPackage, 
    FiPrinter, FiCheckCircle, FiClock, FiXCircle, FiGrid, FiSettings
} from 'react-icons/fi';
import { Table, Checkbox, Tag, Modal, message, Skeleton, Empty, Button as AntButton, Input, Spin, Tabs } from 'antd';

const { TextArea } = Input;

const PickList = () => {
    const API_URL = '/api/resource/Pick List';
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [search, setSearch] = useState('');

    const initialFormState = {
        naming_series: 'STO-PICK-.YYYY.-',
        company: '',
        purpose: 'Material Transfer for Manufacture',
        work_order: '',
        warehouse: '',
        consider_rejected_warehouses: 0,
        pick_manually: 0,
        ignore_pricing_rule: 0,
        scan_mode: 0,
        prompt_qty: 0,
        scan_barcode: '',
        locations: [],
        group_same_items: 0,
        status: 'Draft'
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (view === 'list') fetchRecords();
    }, [view]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const response = await API.get(`${API_URL}?fields=["name","purpose","status","company","warehouse"]&order_by=creation desc`);
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
            title: 'Delete Pick List?',
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

    const addLocationRow = () => {
        setFormData({
            ...formData,
            locations: [...(formData.locations || []), { item_code: '', warehouse: '', qty: 0, stock_qty: 0, picked_qty: 0 }]
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
                    <h1 className="text-xl font-bold">Pick Lists</h1>
                    <button 
                        onClick={() => { setFormData(initialFormState); setCurrentRecord(null); setView('form'); }}
                        className="bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        + New Pick List
                    </button>
                </div>

                <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-sm">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <input 
                            className="w-full max-w-md border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                            placeholder="Search by name, purpose..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Spin spinning={loading}>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Name', 'Purpose', 'Status', ''].map(h => <th key={h} className={th}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map((r) => (
                                    <tr key={r.name} className="hover:bg-blue-50/30 cursor-pointer transition-colors group" onClick={() => handleEdit(r.name)}>
                                        <td className="px-4 py-3 font-medium text-blue-600">{r.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{r.purpose}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                r.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
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
                                <label className={lbl}>Series *</label>
                                <select className={inp} value={formData.naming_series} onChange={e => setFormData({...formData, naming_series: e.target.value})}>
                                    <option value="STO-PICK-.YYYY.-">STO-PICK-.YYYY.-</option>
                                </select>
                            </div>
                            <div>
                                <label className={lbl}>Company *</label>
                                <input className={inp} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                            </div>
                            <div>
                                <label className={lbl}>Purpose</label>
                                <select className={inp} value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})}>
                                    <option value="Material Transfer for Manufacture">Material Transfer for Manufacture</option>
                                    <option value="Delivery">Delivery</option>
                                </select>
                            </div>
                            <div>
                                <label className={lbl}>Work Order</label>
                                <input className={inp} value={formData.work_order} onChange={e => setFormData({...formData, work_order: e.target.value})} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className={lbl}>Warehouse</label>
                                <input className={inp} value={formData.warehouse} onChange={e => setFormData({...formData, warehouse: e.target.value})} />
                                <p className="text-[10px] text-gray-400 mt-1">Items under this warehouse will be suggested</p>
                            </div>
                            
                            <div className="space-y-3 pt-2">
                                <div className="space-y-1">
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" checked={!!formData.consider_rejected_warehouses} onChange={e => setFormData({...formData, consider_rejected_warehouses: e.target.checked ? 1 : 0})} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5" />
                                        <span className="text-sm font-semibold text-gray-700">Consider Rejected Warehouses</span>
                                    </label>
                                    <p className="text-xs text-gray-400 ml-6">Enable it if users want to consider rejected materials to dispatch.</p>
                                </div>

                                <div className="pt-2">
                                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded border border-gray-200 hover:bg-gray-200 transition">Get Item Locations</button>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="space-y-1">
                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="checkbox" checked={!!formData.pick_manually} onChange={e => setFormData({...formData, pick_manually: e.target.checked ? 1 : 0})} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5" />
                                            <span className="text-sm font-semibold text-gray-700">Pick Manually</span>
                                        </label>
                                        <p className="text-xs text-gray-400 ml-6">If enabled then system won't override the picked qty / batches / serial numbers.</p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input type="checkbox" checked={!!formData.ignore_pricing_rule} onChange={e => setFormData({...formData, ignore_pricing_rule: e.target.checked ? 1 : 0})} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5" />
                                            <span className="text-sm font-semibold text-gray-700">Ignore Pricing Rule</span>
                                        </label>
                                        <p className="text-xs text-gray-400 ml-6">If enabled then system won't apply the pricing rule on the delivery note which will be create from the pick list</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={sec + " mt-8"}>Scanning</div>
                    <div className="grid grid-cols-2 gap-x-12">
                        <div>
                            <label className={lbl}>Scan Barcode</label>
                            <input className={inp} value={formData.scan_barcode} onChange={e => setFormData({...formData, scan_barcode: e.target.value})} />
                        </div>
                        <div className="space-y-4 pt-6">
                            <div className="space-y-1">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.scan_mode} onChange={e => setFormData({...formData, scan_mode: e.target.checked ? 1 : 0})} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5" />
                                    <span className="text-sm font-semibold text-gray-700">Scan Mode</span>
                                </label>
                                <p className="text-xs text-gray-400 ml-6">If checked, picked qty won't automatically be fulfilled on submit of pick list.</p>
                            </div>
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" checked={!!formData.prompt_qty} onChange={e => setFormData({...formData, prompt_qty: e.target.checked ? 1 : 0})} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5" />
                                <span className="text-sm font-semibold text-gray-700">Prompt Qty</span>
                            </label>
                        </div>
                    </div>

                    <div className={sec + " mt-8"}>Item Locations</div>
                    <div className="border border-gray-200 rounded overflow-hidden text-xs bg-gray-50 mt-4">
                        <table className="w-full text-left">
                            <thead className="bg-[#f8f9fa] border-b border-gray-100">
                                <tr>
                                    <th className="w-8 !px-2 !py-2 text-center text-gray-400"><input type="checkbox" disabled /></th>
                                    <th className="!px-4 !py-2 !font-semibold !text-gray-500 w-12 text-center">No.</th>
                                    <th className="!px-4 !py-2 !font-semibold !text-gray-500">Item *</th>
                                    <th className="!px-4 !py-2 !font-semibold !text-gray-500">Warehouse</th>
                                    <th className="!px-4 !py-2 !font-semibold !text-gray-500 text-right">Qty *</th>
                                    <th className="!px-4 !py-2 !font-semibold !text-gray-500 text-right">Stock Qty</th>
                                    <th className="!px-4 !py-2 !font-semibold !text-gray-500 text-right">Picked Qty</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {formData.locations.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-400 flex flex-col items-center justify-center gap-2">
                                            <svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 8h6M9 12h6M9 16h2"/></svg>
                                            <span>No Data</span>
                                        </td>
                                    </tr>
                                ) : (
                                    formData.locations.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 group">
                                            <td className="w-8 px-2 py-2 text-center"><input type="checkbox" /></td>
                                            <td className="px-4 py-2 text-center text-gray-400">{i + 1}</td>
                                            <td className="px-4 py-2">
                                                <input className={ri} value={row.item_code} onChange={e => {
                                                    const nl = [...formData.locations]; nl[i].item_code = e.target.value; setFormData({...formData, locations: nl});
                                                }} />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input className={ri} value={row.warehouse} onChange={e => {
                                                    const nl = [...formData.locations]; nl[i].warehouse = e.target.value; setFormData({...formData, locations: nl});
                                                }} />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input type="number" className={ri + " text-right font-semibold"} value={row.qty} onChange={e => {
                                                    const nl = [...formData.locations]; nl[i].qty = parseFloat(e.target.value) || 0; setFormData({...formData, locations: nl});
                                                }} />
                                            </td>
                                            <td className="px-4 py-2 text-right text-gray-500">{row.stock_qty}</td>
                                            <td className="px-4 py-2 text-right text-gray-500">{row.picked_qty}</td>
                                            <td className="px-4 py-2 text-center text-red-400 hover:text-red-600 cursor-pointer" onClick={() => {
                                                const nl = [...formData.locations]; nl.splice(i,1); setFormData({...formData, locations: nl});
                                            }}>✕</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="p-3 bg-white border-t flex">
                            <button onClick={addLocationRow} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition border">Add Row</button>
                        </div>
                    </div>

                    <div className={sec + " mt-8"}>Print Settings</div>
                    <div className="mt-4">
                        <label className="flex items-center gap-2 cursor-pointer mt-4">
                            <input type="checkbox" checked={!!formData.group_same_items} onChange={e => setFormData({...formData, group_same_items: e.target.checked ? 1 : 0})} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                            <span className="text-sm font-semibold text-gray-700">Group Same Items</span>
                        </label>
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
                    <h1 className="text-xl font-bold">{currentRecord || 'New Pick List'}</h1>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">{currentRecord ? formData.status : 'Draft'}</span>
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

export default PickList;
