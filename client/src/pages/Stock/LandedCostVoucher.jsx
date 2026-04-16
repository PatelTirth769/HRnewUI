import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { notification, Spin, Select } from 'antd';
import { FiRefreshCw, FiChevronLeft, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

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
const InputField = ({ label, value, required = false, onChange, type = 'text', disabled = false, bg = 'bg-white' }) => (
    <div>
        {label && <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>}
        <input
            type={type}
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : `focus:border-blue-400 ${bg} shadow-sm transition-colors`}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        />
    </div>
);

const SelectField = ({ label, value, required = false, onChange, options = [], disabled = false, bg = 'bg-white' }) => (
    <div>
        {label && <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>}
        <select
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : `focus:border-blue-400 ${bg} shadow-sm transition-colors`}`}
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

export default function LandedCostVoucher() {
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
        purchase_receipts: [],
        items: [],
        taxes: [],
        distribute_charges_based_on: 'Qty'
    });

    const [companies, setCompanies] = useState([]);
    const [prList, setPrList] = useState([]);
    const [piList, setPiList] = useState([]);
    const [itemsList, setItemsList] = useState([]);
    const [accountsList, setAccountsList] = useState([]);
    const [namingSeries, setNamingSeries] = useState([]);

    useEffect(() => {
        fetchData();
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [compRes, prRes, piRes, itemRes, accRes, metaRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=100'),
                API.get('/api/resource/Purchase Receipt?fields=["name","supplier","grand_total"]&limit_page_length=200'),
                API.get('/api/resource/Purchase Invoice?fields=["name","supplier","grand_total"]&limit_page_length=200'),
                API.get('/api/resource/Item?fields=["name","item_name","description"]&limit_page_length=300'),
                API.get('/api/resource/Account?fields=["name","account_name"]&limit_page_length=200'),
                API.get('/api/resource/DocType/Landed Cost Voucher')
            ]);
            setCompanies(compRes.data?.data || []);
            setPrList(prRes.data?.data || []);
            setPiList(piRes.data?.data || []);
            setItemsList(itemRes.data?.data || []);
            setAccountsList(accRes.data?.data || []);
            
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
            const res = await API.get('/api/resource/Landed Cost Voucher?fields=["name","company","posting_date","docstatus","grand_total"]&order_by=modified desc');
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
            const res = await API.get(`/api/resource/Landed Cost Voucher/${encodeURIComponent(name)}`);
            const v = res.data?.data || {};
            setFormData({
                naming_series: v.naming_series || '',
                company: v.company || '',
                posting_date: v.posting_date || new Date().toISOString().split('T')[0],
                purchase_receipts: Array.isArray(v.purchase_receipts) ? v.purchase_receipts : [],
                items: Array.isArray(v.items) ? v.items : [],
                taxes: Array.isArray(v.taxes) ? v.taxes : [],
                distribute_charges_based_on: v.distribute_charges_based_on || 'Qty'
            });
        } catch (err) {
            notification.error({ message: 'Failed to load details' });
        } finally {
            setLoading(false);
        }
    };

    const handleNew = () => {
        setEditingRecord(null);
        setFormData({
            naming_series: namingSeries[0] || 'MAT-LCV-.YYYY.-',
            company: companies[0]?.name || '',
            posting_date: new Date().toISOString().split('T')[0],
            purchase_receipts: [],
            items: [],
            taxes: [],
            distribute_charges_based_on: 'Qty'
        });
        setView('form');
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        fetchSingle(record.name);
        setView('form');
    };

    const handleSave = async () => {
        if (!formData.company || formData.purchase_receipts.length === 0) {
            notification.warning({ message: 'Company and at least one Purchase Receipt are required.' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Landed Cost Voucher/${encodeURIComponent(editingRecord.name)}`, formData);
                notification.success({ message: 'Updated successfully' });
            } else {
                await API.post('/api/resource/Landed Cost Voucher', formData);
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

    /* ── Handlers for Purchase Receipts Table ── */
    const addPrRow = () => setFormData(p => ({ ...p, purchase_receipts: [...p.purchase_receipts, { receipt_document_type: '', receipt_document: '', supplier: '', grand_total: 0 }] }));
    const removePrRow = (idx) => setFormData(p => ({ ...p, purchase_receipts: p.purchase_receipts.filter((_, i) => i !== idx) }));
    const updatePrRow = (idx, field, val) => {
        const arr = [...formData.purchase_receipts];
        arr[idx] = { ...arr[idx], [field]: val };
        
        // Auto-fill supplier & total if document is selected
        if (field === 'receipt_document' && val) {
            const type = arr[idx].receipt_document_type;
            const doc = type === 'Purchase Receipt' ? prList.find(r => r.name === val) : piList.find(r => r.name === val);
            if (doc) {
                arr[idx].supplier = doc.supplier || '';
                arr[idx].grand_total = doc.grand_total || 0;
            }
        }
        setFormData(p => ({ ...p, purchase_receipts: arr }));
    };

    /* ── Handlers for PR Items Table ── */
    const addItemRow = () => setFormData(p => ({ ...p, items: [...p.items, { item_code: '', description: '', qty: 0, amount: 0, applicable_charges: 0 }] }));
    const removeItemRow = (idx) => setFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
    const updateItemRow = (idx, field, val) => {
        const arr = [...formData.items];
        arr[idx] = { ...arr[idx], [field]: val };
        if (field === 'item_code' && val) {
            const item = itemsList.find(i => i.name === val);
            if (item) arr[idx].description = item.description || item.item_name || '';
        }
        setFormData(p => ({ ...p, items: arr }));
    };
    const mockGetItemsFromPR = () => {
        notification.info({ message: 'Fetching items from PR...' });
        // In reality, this would make an API call to frappe backend to pull items from the selected PRs
    };

    /* ── Handlers for Taxes Table ── */
    const addTaxRow = () => setFormData(p => ({ ...p, taxes: [...p.taxes, { expense_account: '', description: '', amount: 0 }] }));
    const removeTaxRow = (idx) => setFormData(p => ({ ...p, taxes: p.taxes.filter((_, i) => i !== idx) }));
    const updateTaxRow = (idx, field, val) => {
        const arr = [...formData.taxes];
        arr[idx] = { ...arr[idx], [field]: val };
        if (field === 'expense_account' && val) {
            const acc = accountsList.find(a => a.name === val);
            if (acc) arr[idx].description = acc.account_name || '';
        }
        setFormData(p => ({ ...p, taxes: arr }));
    };


    /* ═══════════ FORM VIEW ═══════════ */
    if (view === 'form') {
        return (
            <div className="p-6 max-w-[1240px] mx-auto pb-24 text-gray-800">
                <style>{`
                    .custom-checkbox { width: 14px; height: 14px; border-radius: 3px; border: 1px solid #d1d5db; cursor: pointer; }
                    .custom-checkbox:checked { background-color: #1C1F26; border-color: #1C1F26; }
                    .custom-select-borderless .ant-select-selector { border: none !important; background: transparent !important; padding: 0 !important; box-shadow: none !important; font-size: 13px !important; color: #374151 !important; }
                    .custom-select-borderless .ant-select-selection-placeholder { padding: 0 !important; }
                `}</style>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1" onClick={() => setView('list')}>
                            <FiChevronLeft size={24} />
                        </button>
                        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
                            {editingRecord ? editingRecord.name : 'New Landed Cost Voucher'}
                        </h1>
                        {!editingRecord && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fdf2e9] text-[#e06c27] font-semibold tracking-wide uppercase">Not Saved</span>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        <button className="px-5 py-1.5 bg-[#1C1F26] text-white rounded text-[13px] font-semibold hover:bg-black transition-colors disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden text-[13px]">
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-6">
                                <SelectField label="Series" value={formData.naming_series} required options={namingSeries.map(s => ({ value: s, label: s }))} onChange={v => setFormData(p => ({...p, naming_series: v}))} bg="bg-gray-50/50" />
                                <SelectField label="Company" value={formData.company} required options={companies.map(c => ({ value: c.name, label: c.name }))} onChange={v => setFormData(p => ({...p, company: v}))} bg="bg-gray-50/50" />
                            </div>
                            <div className="space-y-6">
                                <InputField label="Posting Date" type="date" value={formData.posting_date} required onChange={v => setFormData(p => ({...p, posting_date: v}))} bg="bg-gray-50/50" />
                            </div>
                        </div>
                    </div>

                    {/* Table 1: Purchase Receipts */}
                    <div className="p-6 pt-2 border-t border-gray-100">
                        <h3 className="text-[13px] font-bold text-gray-600 mb-3 tracking-wide">Purchase Receipts</h3>
                        <div className="border border-gray-100 rounded bg-white overflow-hidden">
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-[#f8f9fa]">
                                    <tr className="border-b border-gray-100">
                                        <th className="px-4 py-2 text-center w-10"><input type="checkbox" className="custom-checkbox" /></th>
                                        <th className="py-2 text-gray-500 font-semibold w-12 text-center">No.</th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 w-1/4">Receipt Document Type <span className="text-[#E02424]">*</span></th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 w-1/4">Receipt Document <span className="text-[#E02424]">*</span></th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 text-left">Supplier</th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 text-right w-32">Grand Total</th>
                                        <th className="px-4 py-2 text-center w-10 text-gray-400">⚙️</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.purchase_receipts.map((row, idx) => (
                                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 relative group">
                                            <td className="px-4 py-2 text-center"><input type="checkbox" className="custom-checkbox" /></td>
                                            <td className="py-2 text-gray-400 text-center">{idx + 1}</td>
                                            <td className="px-4 py-2">
                                                <select className="w-full border-none bg-transparent focus:ring-0 p-0 text-[13px] text-gray-800" value={row.receipt_document_type} onChange={e => updatePrRow(idx, 'receipt_document_type', e.target.value)}>
                                                    <option value="">Select...</option>
                                                    <option value="Purchase Receipt">Purchase Receipt</option>
                                                    <option value="Purchase Invoice">Purchase Invoice</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <Select showSearch className="w-full custom-select-borderless" value={row.receipt_document || undefined} onChange={v => updatePrRow(idx, 'receipt_document', v)} options={(row.receipt_document_type === 'Purchase Receipt' ? prList : piList).map(r => ({value: r.name, label: r.name}))} />
                                            </td>
                                            <td className="px-4 py-2"><input type="text" className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] text-gray-600" value={row.supplier} readOnly /></td>
                                            <td className="px-4 py-2 text-right text-gray-600 flex justify-end">₹ <input type="number" className="w-20 ml-1 text-right bg-transparent border-none focus:ring-0 p-0 text-[13px]" value={row.grand_total} readOnly /></td>
                                            <td className="px-4 py-2 text-center"><button className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-colors" onClick={() => removePrRow(idx)}><FiTrash2 size={13}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3">
                            <button className="px-3 py-1 bg-gray-100 rounded text-gray-800 text-[12px] font-semibold hover:bg-gray-200" onClick={addPrRow}>Add Row</button>
                        </div>
                    </div>

                    {/* Table 2: Purchase Receipt Items */}
                    <div className="p-6 pt-6 border-t border-gray-100">
                        <h3 className="text-[14px] font-bold text-gray-800 mb-4 tracking-tight">Purchase Receipt Items</h3>
                        <button className="px-3 py-1.5 mb-4 bg-[#f1f3f5] rounded text-gray-700 text-[12px] font-semibold hover:bg-[#e9ecef] transition-colors" onClick={mockGetItemsFromPR}>Get Items From Purchase Receipts</button>
                        
                        <p className="text-[13px] text-gray-500 mb-2 font-semibold">Purchase Receipt Items</p>
                        <div className="border border-gray-100 rounded bg-white overflow-hidden">
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-[#f8f9fa]">
                                    <tr className="border-b border-gray-100">
                                        <th className="px-4 py-2 text-center w-10"><input type="checkbox" className="custom-checkbox" /></th>
                                        <th className="py-2 text-gray-500 font-semibold w-12 text-center">No.</th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 w-1/4">Item Code <span className="text-[#E02424]">*</span></th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 w-1/4">Description <span className="text-[#E02424]">*</span></th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 text-right w-24">Qty</th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 text-right w-32">Amount <span className="text-[#E02424]">*</span></th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 text-right w-40">Applicable Charges</th>
                                        <th className="px-4 py-2 text-center w-10 text-gray-400">⚙️</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((row, idx) => (
                                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 relative group">
                                            <td className="px-4 py-2 text-center"><input type="checkbox" className="custom-checkbox" /></td>
                                            <td className="py-2 text-gray-400 text-center">{idx + 1}</td>
                                            <td className="px-4 py-2">
                                                <Select showSearch className="w-full custom-select-borderless bg-transparent" value={row.item_code || undefined} onChange={v => updateItemRow(idx, 'item_code', v)} options={itemsList.map(i => ({value: i.name, label: i.name}))} />
                                            </td>
                                            <td className="px-4 py-2"><input type="text" className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] text-gray-600" value={row.description} onChange={e => updateItemRow(idx, 'description', e.target.value)} /></td>
                                            <td className="px-4 py-2"><input type="number" className="w-full bg-transparent text-right border-none focus:ring-0 p-0 text-[13px]" value={row.qty} step="0.001" onChange={e => updateItemRow(idx, 'qty', parseFloat(e.target.value)||0)} /></td>
                                            <td className="px-4 py-2 text-right text-gray-600 flex justify-end items-center">₹ <input type="number" className="w-20 ml-1 text-right bg-transparent border-none focus:ring-0 p-0 text-[13px]" value={row.amount} step="0.01" onChange={e => updateItemRow(idx, 'amount', parseFloat(e.target.value)||0)} /></td>
                                            <td className="px-4 py-2 text-right text-gray-600">₹ <input type="number" className="w-24 ml-1 text-right bg-transparent border-none focus:ring-0 p-0 text-[13px]" value={row.applicable_charges} readOnly /></td>
                                            <td className="px-4 py-2 text-center"><button className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-colors" onClick={() => removeItemRow(idx)}><FiTrash2 size={13}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3">
                            <button className="px-3 py-1 bg-gray-100 rounded text-gray-800 text-[12px] font-semibold hover:bg-gray-200" onClick={addItemRow}>Add Row</button>
                        </div>
                    </div>

                    {/* Table 3: Applicable Charges */}
                    <div className="p-6 pt-6 border-t border-gray-100">
                        <h3 className="text-[14px] font-bold text-gray-800 mb-4 tracking-tight">Applicable Charges</h3>
                        <p className="text-[13px] text-gray-500 mb-2 font-semibold">Taxes and Charges</p>
                        
                        <div className="border border-gray-100 rounded bg-white overflow-hidden">
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-[#f8f9fa]">
                                    <tr className="border-b border-gray-100">
                                        <th className="px-4 py-2 text-center w-10"><input type="checkbox" className="custom-checkbox" /></th>
                                        <th className="py-2 text-gray-500 font-semibold w-12 text-center">No.</th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 w-1/3">Expense Account</th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 w-1/3">Description <span className="text-[#E02424]">*</span></th>
                                        <th className="px-4 py-2 font-semibold text-gray-500 text-right w-40">Amount <span className="text-[#E02424]">*</span></th>
                                        <th className="px-4 py-2 text-center w-10 text-gray-400">⚙️</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.taxes.map((row, idx) => (
                                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 relative group">
                                            <td className="px-4 py-2 text-center"><input type="checkbox" className="custom-checkbox" /></td>
                                            <td className="py-2 text-gray-400 text-center">{idx + 1}</td>
                                            <td className="px-4 py-2">
                                                <Select showSearch className="w-full custom-select-borderless bg-transparent" value={row.expense_account || undefined} onChange={v => updateTaxRow(idx, 'expense_account', v)} options={accountsList.map(a => ({value: a.name, label: a.account_name || a.name}))} />
                                            </td>
                                            <td className="px-4 py-2"><input type="text" className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] text-gray-600" value={row.description} onChange={e => updateTaxRow(idx, 'description', e.target.value)} /></td>
                                            <td className="px-4 py-2 text-right text-gray-600 flex items-center justify-end">₹ <input type="number" className="w-24 ml-1 text-right bg-transparent border-none focus:ring-0 p-0 text-[13px]" value={row.amount} step="0.01" onChange={e => updateTaxRow(idx, 'amount', parseFloat(e.target.value)||0)} /></td>
                                            <td className="px-4 py-2 text-center"><button className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-colors" onClick={() => removeTaxRow(idx)}><FiTrash2 size={13}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3 mb-8">
                            <button className="px-3 py-1 bg-gray-100 rounded text-gray-800 text-[12px] font-semibold hover:bg-gray-200" onClick={addTaxRow}>Add Row</button>
                        </div>

                        <div className="flex justify-end pr-8">
                            <div className="w-[300px]">
                                <SelectField
                                    label="Distribute Charges Based On"
                                    required
                                    value={formData.distribute_charges_based_on}
                                    options={[
                                        { value: 'Qty', label: 'Qty' },
                                        { value: 'Amount', label: 'Amount' },
                                        { value: 'Distribute Manually', label: 'Distribute Manually' }
                                    ]}
                                    bg="bg-gray-50/50"
                                    onChange={v => setFormData(p => ({...p, distribute_charges_based_on: v}))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes Section block */}
                    <div className="p-8 pb-10 bg-[#f1f3f5] border-t border-gray-200">
                        <h4 className="text-[16px] font-bold text-gray-800 mb-4 tracking-tight">Notes:</h4>
                        <ul className="list-disc pl-6 space-y-1 text-[13px] text-gray-600">
                            <li>Charges will be distributed proportionately based on item qty or amount, as per your selection</li>
                            <li>Remove item if charges is not applicable to that item</li>
                            <li>Charges are updated in Purchase Receipt against each item</li>
                            <li>Item valuation rate is recalculated considering landed cost voucher amount</li>
                            <li>Stock Ledger Entries and GL Entries are reposted for the selected Purchase Receipts</li>
                        </ul>
                    </div>

                </div>
            </div>
        );
    }

    /* ═══════════ LIST VIEW ═══════════ */
    return (
        <div className="p-6 max-w-[1240px] mx-auto text-gray-800">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Landed Cost Voucher</h1>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-all text-gray-600" onClick={fetchData} disabled={loading}>
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </button>
                    <button className="px-4 py-2 bg-[#1C1F26] text-white rounded text-sm font-semibold hover:bg-black transition-all flex items-center shadow-sm" onClick={handleNew}>
                        Add Landed Cost Voucher
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead className="bg-[#f8f9fa] border-b border-gray-100 text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Posting Date</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Company</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Status</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-right">Grand Total</th>
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
                                    <tr key={row.name} className="hover:bg-blue-50/20 group transition-colors cursor-pointer" onClick={() => handleEdit(row)}>
                                        <td className="px-6 py-4 font-bold text-blue-600">{row.name}</td>
                                        <td className="px-6 py-4 text-gray-700">{row.posting_date}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.company}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${row.docstatus === 1 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {row.docstatus === 1 ? 'Submitted' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-800">
                                            ₹ {row.grand_total?.toFixed(2) || '0.00'}
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
        </div>
    );
}
