import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { notification, Spin, Table } from 'antd';
import { FiRefreshCw, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal, FiChevronUp, FiChevronDown, FiCopy, FiEdit2, FiEye, FiEyeOff } from 'react-icons/fi';

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

/* ─── small shared components ─── */
const ReadOnlyField = ({ label, value, required }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <div className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700 min-h-[38px]">
            {value || ''}
        </div>
    </div>
);

const SelectFieldSm = ({ label, value, required, onChange, options = [] }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <select
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white shadow-sm"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    </div>
);

const CheckboxField = ({ label, checked, onChange }) => (
    <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
        <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={!!checked}
            onChange={(e) => onChange(e.target.checked)}
        />
        {label}
    </label>
);

const InputFieldSm = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">{label}</label>
        <input
            type={type}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white shadow-sm"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

/* ─── Collapsible Section ─── */
const Section = ({ title, defaultOpen = true, children }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-gray-100">
            <button
                className="w-full flex items-center gap-2 px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <span className="text-[15px] font-bold text-gray-800">{title}</span>
                {open ? <FiChevronUp className="ml-auto text-gray-400" /> : <FiChevronDown className="ml-auto text-gray-400" />}
            </button>
            {open && <div className="px-6 pb-6">{children}</div>}
        </div>
    );
};

/* ─── Child table with checkbox column ─── */
const ChildTable = ({ columns, rows, onToggleAll, allChecked, someChecked, onToggleRow, selectedRows, emptyText = 'No Data' }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-[13px]">
            <thead>
                <tr className="bg-gray-50">
                    <th className="px-3 py-3 w-10 border-b border-gray-200">
                        <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={allChecked}
                            ref={(el) => { if (el) el.indeterminate = someChecked; }}
                            onChange={onToggleAll}
                        />
                    </th>
                    {columns.map((col) => (
                        <th key={col.key} className={`px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 ${col.required ? '' : ''}`}>
                            {col.label} {col.required && <span className="text-[#E02424]">*</span>}
                        </th>
                    ))}
                    <th className="px-3 py-3 w-10 border-b border-gray-200 text-right">
                        <button className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {rows.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length + 2} className="px-4 py-10 text-center text-gray-400">
                            <div className="flex flex-col items-center gap-1">
                                <svg className="w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                                </svg>
                                <span className="text-xs font-medium">{emptyText}</span>
                            </div>
                        </td>
                    </tr>
                ) : (
                    rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-3 py-3">
                                <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    checked={selectedRows.includes(idx)}
                                    onChange={() => onToggleRow(idx)}
                                />
                            </td>
                            {columns.map((col) => (
                                <td key={col.key} className="px-4 py-3 text-gray-700">{row[col.key] ?? '-'}</td>
                            ))}
                            <td className="px-3 py-3 text-right">
                                <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600">
                                    <FiEdit2 size={12} />
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════ */
export default function SerialNoServiceContractExpiry() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // ── report meta state ──
    const [reportMeta, setReportMeta] = useState({
        ref_doctype: 'Serial No',
        report_type: 'Report Builder',
        reference_report: '',
        is_standard: 'Yes',
        module: 'Stock',
        add_total_row: false,
        disabled: false,
        prepared_report: false,
        timeout: 0,
    });

    // ── child tables ──
    const [filterRows, setFilterRows] = useState([]);
    const [columnRows, setColumnRows] = useState([]);
    const [roleRows, setRoleRows] = useState([]);
    const [clientCode, setClientCode] = useState('');

    // ── selection state for child tables ──
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);

    // ── report view state ──
    const [showingReport, setShowingReport] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [listData, setListData] = useState([]);
    const [selectedListRows, setSelectedListRows] = useState([]);
    const [reportFilters, setReportFilters] = useState({ serial_no: '', item_code: '', status: '', company: '' });

    // ── dropdown options for report filter bar ──
    const [filterOptions, setFilterOptions] = useState({ serial_no: [], item_code: [], company: [] });

    const fetchFilterOptions = async () => {
        try {
            const [snRes, itemRes, compRes] = await Promise.all([
                API.get('/api/resource/Serial No?fields=["name"]&limit_page_length=500&order_by=modified desc'),
                API.get('/api/resource/Item?fields=["name","item_name","item_group"]&limit_page_length=500&order_by=modified desc'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=500&order_by=modified desc'),
            ]);
            setFilterOptions({
                serial_no: (snRes.data?.data || []).map(d => d.name),
                item_code: (itemRes.data?.data || []).map(d => ({ name: d.name, item_name: d.item_name || '', item_group: d.item_group || '' })),
                company: (compRes.data?.data || []).map(d => d.name),
            });
        } catch (err) {
            console.error('Failed to fetch filter options:', err);
        }
    };

    useEffect(() => {
        fetchReportMeta();
    }, []);

    const fetchReportMeta = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Report/${encodeURIComponent('Serial No Service Contract Expiry')}`);
            const d = res.data?.data;
            if (d) {
                setReportMeta({
                    ref_doctype: d.ref_doctype || 'Serial No',
                    report_type: d.report_type || 'Report Builder',
                    reference_report: d.reference_report || '',
                    is_standard: d.is_standard || 'Yes',
                    module: d.module || 'Stock',
                    add_total_row: !!d.add_total_row,
                    disabled: !!d.disabled,
                    prepared_report: !!d.prepared_report,
                    timeout: d.timeout || 0,
                });
                setFilterRows(d.filters || []);
                setColumnRows(d.columns || []);
                setRoleRows(d.roles || []);
                // Build client code JSON
                const json = d.json ? (typeof d.json === 'string' ? d.json : JSON.stringify(d.json, null, 2)) : '';
                setClientCode(json);
            }
        } catch (err) {
            console.error('Failed to fetch report meta:', err);
            // Set defaults if fetch fails
            setClientCode(JSON.stringify({
                add_total_row: 0,
                sort_by: "Serial No.modified",
                sort_order: "desc",
                sort_by_next: null,
                filters: [["Serial No", "warehouse", "=", ""]],
                sort_order_next: "desc",
                columns: [
                    ["name", "Serial No"], ["item_code", "Serial No"], ["amc_expiry_date", "Serial No"],
                    ["maintenance_status", "Serial No"], ["item_name", "Serial No"], ["description", "Serial No"],
                    ["item_group", "Serial No"], ["brand", "Serial No"]
                ]
            }, null, 2));
            setRoleRows([
                { idx: 1, role: 'Item Manager' },
                { idx: 2, role: 'Stock Manager' },
                { idx: 3, role: 'Stock User' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                add_total_row: reportMeta.add_total_row ? 1 : 0,
                disabled: reportMeta.disabled ? 1 : 0,
                prepared_report: reportMeta.prepared_report ? 1 : 0,
                timeout: reportMeta.timeout,
                report_type: reportMeta.report_type,
            };
            await API.put(`/api/resource/Report/${encodeURIComponent('Serial No Service Contract Expiry')}`, payload);
            notification.success({ message: 'Report saved successfully' });
            setDirty(false);
        } catch (err) {
            notification.error({ message: 'Save Failed', description: parseServerMessage(err) });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleDisabled = async () => {
        const newVal = !reportMeta.disabled;
        setReportMeta(prev => ({ ...prev, disabled: newVal }));
        setDirty(true);
        try {
            await API.put(`/api/resource/Report/${encodeURIComponent('Serial No Service Contract Expiry')}`, { disabled: newVal ? 1 : 0 });
            notification.success({ message: newVal ? 'Report Disabled' : 'Report Enabled' });
            setDirty(false);
        } catch (err) {
            notification.error({ message: 'Failed', description: parseServerMessage(err) });
            setReportMeta(prev => ({ ...prev, disabled: !newVal }));
        }
    };

    const handleShowReport = async () => {
        setShowingReport(true);
        setReportLoading(true);
        fetchFilterOptions();
        try {
            const fields = encodeURIComponent(
                '["name","serial_no","item_code","item_name","status","company","warehouse","maintenance_status","amc_expiry_date"]'
            );
            let url = `/api/resource/Serial No?fields=${fields}&limit_page_length=500&order_by=modified desc`;
            const apiFilters = [];
            if (reportFilters.serial_no) apiFilters.push(`["name","like","%${reportFilters.serial_no}%"]`);
            if (reportFilters.item_code) apiFilters.push(`["item_code","like","%${reportFilters.item_code}%"]`);
            if (reportFilters.status) apiFilters.push(`["status","=","${reportFilters.status}"]`);
            if (reportFilters.company) apiFilters.push(`["company","like","%${reportFilters.company}%"]`);
            if (apiFilters.length > 0) url += `&filters=[${apiFilters.join(',')}]`;
            const res = await API.get(url);
            setListData(res.data?.data || []);
        } catch (err) {
            notification.error({ message: 'Failed to load data', description: parseServerMessage(err) });
            setListData([]);
        } finally {
            setReportLoading(false);
        }
    };

    const setMeta = (key, val) => {
        setReportMeta(prev => ({ ...prev, [key]: val }));
        setDirty(true);
    };

    const toggleChildSelect = (setter, list, idx) => {
        setter(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    };

    const copyJSON = () => {
        navigator.clipboard.writeText(clientCode);
        notification.success({ message: 'JSON copied to clipboard' });
    };

    /* ═══════════ REPORT DATA VIEW (ERPNext List Style) ═══════════ */
    if (showingReport) {
        return (
            <div className="text-gray-800 h-full flex flex-col">
                {/* ── Breadcrumb ── */}
                <div className="px-6 pt-4 pb-2 flex items-center gap-1.5 text-[12px] text-gray-400 font-medium bg-white border-b border-gray-100">
                    <span className="hover:text-blue-600 cursor-pointer transition-colors">Stock</span>
                    <span>›</span>
                    <span className="text-gray-600">Serial No</span>
                </div>

                {/* ── Header ── */}
                <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400" onClick={() => setShowingReport(false)}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-bold text-gray-900">Serial No Service Contract Expiry</h1>
                        {dirty && (
                            <span className="text-[11px] px-2 py-0.5 rounded bg-orange-50 text-orange-500 font-semibold">Not Saved</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Report View
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <button onClick={handleShowReport} className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-all" disabled={reportLoading}>
                            <FiRefreshCw size={14} className={reportLoading ? 'animate-spin' : ''} />
                        </button>
                        <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-500 transition-all">
                            <FiMoreHorizontal size={14} />
                        </button>
                        <button onClick={() => navigate('/stock/serial-no')} className="px-4 py-1.5 bg-[#1C1F26] text-white rounded text-sm font-semibold hover:bg-black transition-all shadow-sm flex items-center gap-1.5">
                            <span className="text-lg leading-none">+</span> Add Serial No
                        </button>
                    </div>
                </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
                        {/* Column Header / Filter Bar */}
                        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
                            <div className="flex items-center gap-2 flex-1">
                                <select className="w-[140px] border border-gray-200 rounded px-2.5 py-1.5 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-blue-400" value={reportFilters.serial_no} onChange={(e) => setReportFilters(prev => ({ ...prev, serial_no: e.target.value }))}>
                                    <option value="">ID</option>
                                    {filterOptions.serial_no.map(sn => <option key={sn} value={sn}>{sn}</option>)}
                                </select>
                                <select className="w-[160px] border border-gray-200 rounded px-2.5 py-1.5 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-blue-400" value={reportFilters.item_code} onChange={(e) => setReportFilters(prev => ({ ...prev, item_code: e.target.value }))}>
                                    <option value="">Item Code</option>
                                    {filterOptions.item_code.map(item => <option key={item.name} value={item.name}>{item.name}{item.item_group ? `, ${item.item_group}` : ''}</option>)}
                                </select>
                                <select className="w-[120px] border border-gray-200 rounded px-2.5 py-1.5 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-blue-400" value={reportFilters.status || ''} onChange={(e) => setReportFilters(prev => ({ ...prev, status: e.target.value }))}>
                                    <option value="">Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Expired">Expired</option>
                                </select>
                                <select className="w-[160px] border border-gray-200 rounded px-2.5 py-1.5 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-blue-400" value={reportFilters.company || ''} onChange={(e) => setReportFilters(prev => ({ ...prev, company: e.target.value }))}>
                                    <option value="">Company</option>
                                    {filterOptions.company.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={handleShowReport} className="px-3 py-1.5 border border-gray-300 rounded text-[12px] font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-all">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                    Filter
                                </button>
                                <button className="text-gray-300 hover:text-gray-500 text-sm transition-colors">✕</button>
                                <button className="px-3 py-1.5 border border-gray-300 rounded text-[12px] font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-all">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    Add Group
                                </button>
                                <button className="px-3 py-1.5 border border-gray-300 rounded text-[12px] font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-all">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                                    Last Updated On
                                </button>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="flex-1 overflow-auto">
                            <Spin spinning={reportLoading}>
                                {listData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                                        <svg className="w-14 h-14 mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                                        </svg>
                                        <p className="text-sm text-gray-500 font-medium">Distinct unit of an Item</p>
                                        <p className="text-sm text-blue-600 hover:underline cursor-pointer mt-1 font-medium">Create your first Serial No</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-[13px] bg-white">
                                        <thead className="sticky top-0 z-10">
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-4 py-3 w-10">
                                                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        checked={listData.length > 0 && selectedListRows.length === listData.length}
                                                        ref={(el) => { if (el) el.indeterminate = selectedListRows.length > 0 && selectedListRows.length < listData.length; }}
                                                        onChange={() => { if (selectedListRows.length === listData.length) setSelectedListRows([]); else setSelectedListRows(listData.map(r => r.name)); }}
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Name (ID)</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Item Code</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Company</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Warehouse</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">AMC Expiry</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Maint. Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {listData.map((row) => {
                                                const isSelected = selectedListRows.includes(row.name);
                                                return (
                                                    <tr key={row.name} className={`transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                                                        onClick={() => setSelectedListRows(prev => prev.includes(row.name) ? prev.filter(n => n !== row.name) : [...prev, row.name])}>
                                                        <td className="px-4 py-3">
                                                            <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={isSelected}
                                                                onChange={() => setSelectedListRows(prev => prev.includes(row.name) ? prev.filter(n => n !== row.name) : [...prev, row.name])}
                                                                onClick={(e) => e.stopPropagation()} />
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-blue-600 hover:underline">{row.serial_no || row.name}</td>
                                                        <td className="px-4 py-3 text-gray-700">{row.item_code || '-'}</td>
                                                        <td className="px-4 py-3 text-gray-600">{row.item_name || '-'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                                                                row.status === 'Active' ? 'bg-blue-50 text-blue-600' :
                                                                row.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                                                                row.status === 'Expired' ? 'bg-red-50 text-red-500' :
                                                                'bg-gray-50 text-gray-500'
                                                            }`}>{row.status || 'Active'}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">{row.company || '-'}</td>
                                                        <td className="px-4 py-3 text-gray-600">{row.warehouse || '-'}</td>
                                                        <td className="px-4 py-3 text-gray-600">{row.amc_expiry_date ? String(row.amc_expiry_date).slice(0, 10) : '-'}</td>
                                                        <td className="px-4 py-3">
                                                            {row.maintenance_status ? (
                                                                <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                                                                    row.maintenance_status === 'Under AMC' ? 'bg-green-50 text-green-600' :
                                                                    row.maintenance_status === 'Under Warranty' ? 'bg-blue-50 text-blue-600' :
                                                                    row.maintenance_status === 'Out of AMC' ? 'bg-red-50 text-red-500' :
                                                                    'bg-gray-50 text-gray-500'
                                                                }`}>{row.maintenance_status}</span>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </Spin>
                        </div>

                        {/* Footer */}
                        <div className="bg-white border-t border-gray-200 px-4 py-2 text-[11px] text-gray-400 flex justify-between items-center">
                            <span>{listData.length} of {listData.length} records</span>
                            {selectedListRows.length > 0 && <span className="text-blue-600 font-semibold">{selectedListRows.length} selected</span>}
                        </div>
                    </div>
            </div>
        );
    }

    /* ═══════════ MAIN FORM VIEW (ERPNext style) ═══════════ */
    return (
        <div className="p-6 max-w-[1200px] mx-auto pb-24 text-gray-800">
            <Spin spinning={loading}>
                {/* ── Breadcrumb ── */}
                <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-4 font-medium">
                    <span className="hover:text-blue-600 cursor-pointer transition-colors">Report</span>
                    <span>›</span>
                    <span className="text-gray-600">Serial No Service Contract Expiry</span>
                </div>

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Serial No Service Contract Expiry</h1>
                        <span className={`text-[11px] px-2.5 py-1 rounded font-semibold ${
                            reportMeta.disabled
                                ? 'bg-gray-100 text-gray-500'
                                : 'bg-blue-50 text-blue-600'
                        }`}>
                            {reportMeta.disabled ? 'Disabled' : 'Enabled'}
                        </span>
                        {dirty && (
                            <span className="text-[11px] px-2 py-0.5 rounded bg-orange-50 text-orange-500 font-semibold">
                                Not Saved
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShowReport}
                            className="px-4 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            Show Report
                        </button>
                        <button
                            onClick={handleToggleDisabled}
                            className="px-4 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            {reportMeta.disabled ? 'Enable Report' : 'Disable Report'}
                        </button>
                        <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-500 transition-all">
                            <FiChevronLeft size={14} />
                        </button>
                        <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-500 transition-all">
                            <FiChevronRight size={14} />
                        </button>
                        <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-500 transition-all">
                            <FiPrinter size={14} />
                        </button>
                        <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-500 transition-all">
                            <FiMoreHorizontal size={14} />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-5 py-1.5 bg-[#1C1F26] text-white rounded text-sm font-semibold hover:bg-black transition-all disabled:opacity-50 shadow-sm"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                {/* ── Main Form ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* ── Top fields ── */}
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                                {/* Left Column */}
                                <div className="space-y-5">
                                    <ReadOnlyField label="Ref DocType" value={reportMeta.ref_doctype} required />
                                    <ReadOnlyField label="Reference Report" value={reportMeta.reference_report} />
                                    <SelectFieldSm
                                        label="Is Standard"
                                        value={reportMeta.is_standard}
                                        required
                                        onChange={(v) => setMeta('is_standard', v)}
                                        options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
                                    />
                                    <SelectFieldSm
                                        label="Module"
                                        value={reportMeta.module}
                                        onChange={(v) => setMeta('module', v)}
                                        options={[
                                            { value: '', label: 'Select Module' },
                                            { value: 'Stock', label: 'Stock' },
                                            { value: 'Accounts', label: 'Accounts' },
                                            { value: 'Selling', label: 'Selling' },
                                            { value: 'Buying', label: 'Buying' },
                                            { value: 'Assets', label: 'Assets' },
                                            { value: 'HR', label: 'HR' },
                                            { value: 'Payroll', label: 'Payroll' },
                                            { value: 'Manufacturing', label: 'Manufacturing' },
                                            { value: 'Projects', label: 'Projects' },
                                            { value: 'CRM', label: 'CRM' },
                                            { value: 'Support', label: 'Support' },
                                            { value: 'Quality Management', label: 'Quality Management' },
                                            { value: 'Education', label: 'Education' },
                                            { value: 'Healthcare', label: 'Healthcare' },
                                            { value: 'Agriculture', label: 'Agriculture' },
                                            { value: 'Non Profit', label: 'Non Profit' },
                                            { value: 'Setup', label: 'Setup' },
                                            { value: 'Core', label: 'Core' },
                                            { value: 'Website', label: 'Website' },
                                            { value: 'E Commerce', label: 'E Commerce' },
                                            { value: 'Regional', label: 'Regional' },
                                            { value: 'Loan Management', label: 'Loan Management' },
                                            { value: 'Subcontracting', label: 'Subcontracting' },
                                            { value: 'Telephony', label: 'Telephony' },
                                            { value: 'Utilities', label: 'Utilities' },
                                        ]}
                                    />
                                </div>

                                {/* Right Column */}
                                <div className="space-y-5">
                                    <SelectFieldSm
                                        label="Report Type"
                                        value={reportMeta.report_type}
                                        required
                                        onChange={(v) => setMeta('report_type', v)}
                                        options={[
                                            { value: 'Report Builder', label: 'Report Builder' },
                                            { value: 'Query Report', label: 'Query Report' },
                                            { value: 'Script Report', label: 'Script Report' },
                                            { value: 'Custom Report', label: 'Custom Report' },
                                        ]}
                                    />
                                    <div className="space-y-3 pt-1">
                                        <CheckboxField label="Add Total Row" checked={reportMeta.add_total_row} onChange={(v) => setMeta('add_total_row', v)} />
                                        <CheckboxField label="Disabled" checked={reportMeta.disabled} onChange={(v) => setMeta('disabled', v)} />
                                        <CheckboxField label="Prepared Report" checked={reportMeta.prepared_report} onChange={(v) => setMeta('prepared_report', v)} />
                                    </div>
                                    {reportMeta.prepared_report && (
                                        <div>
                                            <InputFieldSm
                                                label="Timeout (In Seconds)"
                                                type="number"
                                                value={reportMeta.timeout}
                                                onChange={(v) => setMeta('timeout', parseInt(v) || 0)}
                                                placeholder="Specify a custom timeout, default timeout is 1500 seconds"
                                            />
                                            <p className="text-[11px] text-gray-400 mt-1">Specify a custom timeout, default timeout is 1500 seconds</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Filters Section ── */}
                        <Section title="Filters" defaultOpen={true}>
                            <p className="text-[13px] text-gray-500 mb-3 font-medium">Filters</p>
                            <ChildTable
                                columns={[
                                    { key: 'idx', label: 'No.' },
                                    { key: 'label', label: 'Label', required: true },
                                    { key: 'fieldtype', label: 'Fieldtype', required: true },
                                    { key: 'fieldname', label: 'Fieldname', required: true },
                                    { key: 'mandatory', label: 'Mandatory' },
                                    { key: 'options', label: 'Options' },
                                ]}
                                rows={filterRows.map((r, i) => ({ ...r, idx: i + 1 }))}
                                selectedRows={selectedFilters}
                                allChecked={filterRows.length > 0 && selectedFilters.length === filterRows.length}
                                someChecked={selectedFilters.length > 0 && selectedFilters.length < filterRows.length}
                                onToggleAll={() => {
                                    if (selectedFilters.length === filterRows.length) setSelectedFilters([]);
                                    else setSelectedFilters(filterRows.map((_, i) => i));
                                }}
                                onToggleRow={(idx) => toggleChildSelect(setSelectedFilters, selectedFilters, idx)}
                                emptyText="No Data"
                            />
                            <button className="mt-3 text-[13px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded px-4 py-1.5 hover:bg-gray-50 transition-all">
                                Add Row
                            </button>
                        </Section>

                        {/* ── Columns Section ── */}
                        <Section title="Columns" defaultOpen={true}>
                            <p className="text-[13px] text-gray-500 mb-3 font-medium">Columns</p>
                            <ChildTable
                                columns={[
                                    { key: 'idx', label: 'No.' },
                                    { key: 'fieldname', label: 'Fieldname', required: true },
                                    { key: 'label', label: 'Label', required: true },
                                    { key: 'fieldtype', label: 'Fieldtype', required: true },
                                ]}
                                rows={columnRows.map((r, i) => ({ ...r, idx: i + 1 }))}
                                selectedRows={selectedColumns}
                                allChecked={columnRows.length > 0 && selectedColumns.length === columnRows.length}
                                someChecked={selectedColumns.length > 0 && selectedColumns.length < columnRows.length}
                                onToggleAll={() => {
                                    if (selectedColumns.length === columnRows.length) setSelectedColumns([]);
                                    else setSelectedColumns(columnRows.map((_, i) => i));
                                }}
                                onToggleRow={(idx) => toggleChildSelect(setSelectedColumns, selectedColumns, idx)}
                                emptyText="No Data"
                            />
                            <button className="mt-3 text-[13px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded px-4 py-1.5 hover:bg-gray-50 transition-all">
                                Add Row
                            </button>
                        </Section>

                        {/* ── Client Code Section ── */}
                        <Section title="Client Code" defaultOpen={true}>
                            <p className="text-[13px] text-gray-500 mb-2 font-medium">JSON</p>
                            <div className="relative">
                                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-[12px] text-gray-700 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                                    {clientCode || '{}'}
                                </pre>
                                <button
                                    onClick={copyJSON}
                                    className="absolute top-3 right-3 p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                                    title="Copy JSON"
                                >
                                    <FiCopy size={13} />
                                </button>
                            </div>
                        </Section>

                        {/* ── Roles Section ── */}
                        <Section title="Roles" defaultOpen={true}>
                            <ChildTable
                                columns={[
                                    { key: 'idx', label: 'No.' },
                                    { key: 'role', label: 'Role' },
                                ]}
                                rows={roleRows.map((r, i) => ({ idx: r.idx || i + 1, role: r.role }))}
                                selectedRows={selectedRoles}
                                allChecked={roleRows.length > 0 && selectedRoles.length === roleRows.length}
                                someChecked={selectedRoles.length > 0 && selectedRoles.length < roleRows.length}
                                onToggleAll={() => {
                                    if (selectedRoles.length === roleRows.length) setSelectedRoles([]);
                                    else setSelectedRoles(roleRows.map((_, i) => i));
                                }}
                                onToggleRow={(idx) => toggleChildSelect(setSelectedRoles, selectedRoles, idx)}
                                emptyText="No Roles"
                            />
                            <button className="mt-3 text-[13px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded px-4 py-1.5 hover:bg-gray-50 transition-all">
                                Add Row
                            </button>
                        </Section>
                    </div>
            </Spin>

            <style>{reportTableStyles}</style>
        </div>
    );
}

const reportTableStyles = `
    .ant-table-thead > tr > th {
        background: #f8f9fa !important;
        color: #6b7280 !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        padding: 8px 16px !important;
        border-bottom: 1px solid #f3f4f6 !important;
    }
    .ant-table-tbody > tr > td {
        padding: 8px 16px !important;
        font-size: 13px !important;
        border-bottom: 1px solid #f9fafb !important;
    }
    .ant-table-tbody > tr:hover > td {
        background: #eff6ff !important;
    }
    .custom-filter-select .ant-select-selector {
        height: 33.6px !important;
        padding: 0 11px !important;
        background-color: #f9fafb !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 0.375rem !important;
        display: flex !important;
        align-items: center !important;
        font-size: 0.875rem !important;
    }
    .custom-filter-select .ant-select-selector:hover {
        border-color: #60a5fa !important;
    }
    .custom-filter-select.ant-select-focused .ant-select-selector {
        border-color: #60a5fa !important;
        background-color: #ffffff !important;
        box-shadow: none !important;
    }
    .custom-filter-select .ant-select-selection-placeholder {
        color: #9ca3af !important;
        font-size: 0.875rem !important;
    }
`;
