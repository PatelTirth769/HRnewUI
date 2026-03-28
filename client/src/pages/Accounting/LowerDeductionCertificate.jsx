import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    name: '',
    tax_withholding_category: '',
    company: 'Preeshee Consultancy Services',
    fiscal_year: '',
    certificate_no: '',
    supplier: '',
    pan_no: '',
    valid_from: '',
    valid_upto: '',
    rate_of_tds_as_per_certificate: 0,
    certificate_limit: 0
});

const LowerDeductionCertificate = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form, setForm] = useState(emptyForm());

    const [categories, setCategories] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [fiscalYears, setFiscalYears] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchCertificates();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchCertificate(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Lower Deduction Certificate?fields=["name","certificate_no","supplier","valid_from","valid_upto"]');
            setCertificates(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch certificates' });
        } finally {
            setLoading(false);
        }
    };

    const fetchCertificate = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Lower Deduction Certificate/${encodeURIComponent(name)}`);
            setForm(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [catRes, compRes, fyRes, suppRes] = await Promise.all([
                API.get('/api/resource/Tax Withholding Category?fields=["name"]'),
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Fiscal Year?fields=["name"]'),
                API.get('/api/resource/Supplier?fields=["name"]')
            ]);
            setCategories((catRes.data.data || []).map(d => d.name));
            setCompanies((compRes.data.data || []).map(d => d.name));
            setFiscalYears((fyRes.data.data || []).map(d => d.name));
            setSuppliers((suppRes.data.data || []).map(d => d.name));
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const handleSave = async () => {
        if (!form.certificate_no || !form.supplier) {
            notification.warning({ message: 'Validation', description: 'Certificate No and Supplier are required' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Lower Deduction Certificate/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Certificate updated' });
            } else {
                await API.post('/api/resource/Lower Deduction Certificate', form);
                notification.success({ message: 'Certificate created' });
            }
            setView('list');
        } catch (err) {
            notification.error({ message: 'Error', description: err.response?.data?._server_messages || 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (name) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await API.delete(`/api/resource/Lower Deduction Certificate/${encodeURIComponent(name)}`);
            notification.success({ message: 'Certificate deleted' });
            fetchCertificates();
        } catch (err) {
            notification.error({ message: 'Error', description: 'Delete failed' });
        }
    };

    const inputStyle = "w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all font-bold";
    const labelStyle = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 text-left";
    const sectionTitle = "text-[16px] font-black text-gray-800 mb-8 uppercase tracking-[0.2em] border-b border-gray-100 pb-4 text-left";

    const GridRow = ({ children }) => <div className="grid grid-cols-2 gap-x-12 gap-y-8 mb-12 last:mb-0">{children}</div>;
    const Field = ({ label, children }) => <div><label className={labelStyle}>{label}</label>{children}</div>;

    if (view === 'list') {
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 border border-blue-100 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition shadow-sm font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tighter">Lower Deduction Certificates</h1>
                    </div>
                    <button className="px-5 py-2.5 bg-blue-600 font-bold text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-100 uppercase tracking-widest text-[11px]" onClick={() => { setEditingRecord(null); setView('form'); }}>
                        + Add Certificate
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-50 overflow-hidden shadow-2xl shadow-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-[#FAFBFC] border-b border-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Certificate No</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Supplier</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Validity</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50/50">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-20 italic text-gray-300 font-medium"><Spin /></td></tr>
                            ) : certificates.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-24 text-gray-400 font-bold italic uppercase text-[12px]">No certificates found</td></tr>
                            ) : certificates.map(cert => (
                                <tr key={cert.name} className="hover:bg-blue-50/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <button onClick={() => { setEditingRecord(cert.name); setView('form'); }} className="text-gray-800 font-black hover:text-blue-600 transition-colors">
                                            {cert.certificate_no || cert.name}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {cert.supplier}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                                        {cert.valid_from} to {cert.valid_upto}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(cert.name)} className="text-gray-200 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50" title="Delete">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? `Edit ${editingRecord}` : 'New Lower Deduction Certificate'}
                    </h2>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-black border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button className="px-5 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition font-bold text-xs uppercase tracking-widest shadow-sm" onClick={() => setView('list')}>Cancel</button>
                    <button className="px-8 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <Spin size="small" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* Main Form Fields */}
                <div className="bg-white rounded-2xl border border-gray-100 p-10 shadow-sm">
                    
                    {/* Certificate Details */}
                    <div>
                        <h3 className={sectionTitle}>Certificate Details</h3>
                        <GridRow>
                            <Field label="Tax Withholding Category *">
                                <select className={inputStyle} value={form.tax_withholding_category} onChange={e => setForm({ ...form, tax_withholding_category: e.target.value })}>
                                    <option value="">Select Category...</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </Field>
                            <Field label="Company *">
                                <select className={inputStyle} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}>
                                    <option value="">Select Company...</option>
                                    {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </Field>
                            <Field label="Fiscal Year *">
                                <select className={inputStyle} value={form.fiscal_year} onChange={e => setForm({ ...form, fiscal_year: e.target.value })}>
                                    <option value="">Select Fiscal Year...</option>
                                    {fiscalYears.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                                </select>
                            </Field>
                            <Field label="Certificate No *">
                                <input className={inputStyle} type="text" value={form.certificate_no} onChange={e => setForm({ ...form, certificate_no: e.target.value })} />
                            </Field>
                        </GridRow>
                    </div>

                    {/* Deductee Details */}
                    <div>
                        <h3 className={sectionTitle}>Deductee Details</h3>
                        <GridRow>
                            <Field label="Supplier *">
                                <select className={inputStyle} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
                                    <option value="">Select Supplier...</option>
                                    {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </Field>
                            <Field label="PAN No *">
                                <input className={inputStyle} type="text" value={form.pan_no} onChange={e => setForm({ ...form, pan_no: e.target.value.toUpperCase() })} placeholder="e.g. ABCDE1234F" />
                            </Field>
                        </GridRow>
                    </div>

                    {/* Validity Details */}
                    <div>
                        <h3 className={sectionTitle}>Validity Details</h3>
                        <GridRow>
                            <Field label="Valid From *">
                                <input className={inputStyle} type="date" value={form.valid_from || ''} onChange={e => setForm({ ...form, valid_from: e.target.value })} />
                            </Field>
                            <Field label="Valid Upto *">
                                <input className={inputStyle} type="date" value={form.valid_upto || ''} onChange={e => setForm({ ...form, valid_upto: e.target.value })} />
                            </Field>
                            <Field label="Rate Of TDS As Per Certificate *">
                                <input className={inputStyle} type="number" step="0.01" value={form.rate_of_tds_as_per_certificate} onChange={e => setForm({ ...form, rate_of_tds_as_per_certificate: Number(e.target.value) })} />
                            </Field>
                            <Field label="Certificate Limit *">
                                <input className={inputStyle} type="number" step="0.01" value={form.certificate_limit} onChange={e => setForm({ ...form, certificate_limit: Number(e.target.value) })} />
                            </Field>
                        </GridRow>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LowerDeductionCertificate;
