import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function JobOffer() {
    const [view, setView] = useState('list'); // 'list' | 'form' | 'print'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [printData, setPrintData] = useState(null);
    // Column filters (ERPNext-style)
    const [filterID, setFilterID] = useState('');
    const [filterApplicantName, setFilterApplicantName] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDesignation, setFilterDesignation] = useState('');
    const [filterCompany, setFilterCompany] = useState('');

    // Master data
    const [jobApplicants, setJobApplicants] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [offerTermTemplates, setOfferTermTemplates] = useState([]);
    const [termsAndConditions, setTermsAndConditions] = useState([]);
    const [letterHeads, setLetterHeads] = useState([]);

    // Form data
    const defaultForm = {
        name: '',
        job_applicant: '',
        applicant_name: '',
        applicant_email: '',
        offer_date: '',
        designation: '',
        company: '',
        status: 'Draft',
        job_offer_term_template: '',
        terms: [],
        select_terms_and_conditions: '',
        terms_and_conditions: '',
        letter_head: '',
        print_heading: ''
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH MASTERS ────────────────────────────────────────────
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [appRes, desigRes, compRes, templateRes, tcRes, lhRes] = await Promise.all([
                    API.get('/api/resource/Job Applicant?fields=["name","applicant_name","email_id"]&limit_page_length=None&order_by=modified desc').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Designation?fields=["name"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Company?fields=["name"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Job Offer Term Template?fields=["name"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Terms and Conditions?fields=["name"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Letter Head?fields=["name"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
                ]);
                setJobApplicants((appRes.data?.data || []).map(d => ({ name: d.name, title: d.applicant_name || d.name, email: d.email_id })));
                setDesignations((desigRes.data?.data || []).map(d => d.name));
                setCompanies((compRes.data?.data || []).map(d => d.name));
                setOfferTermTemplates((templateRes.data?.data || []).map(d => d.name));
                setTermsAndConditions((tcRes.data?.data || []).map(d => d.name));
                setLetterHeads((lhRes.data?.data || []).map(d => d.name));

                // Set default company
                if (compRes.data?.data?.length > 0) {
                    // Try to find Preeshe Consultancy Services, otherwise use first
                    const preeshe = compRes.data.data.find(c => c.name.toLowerCase().includes('preeshe consultancy services'));
                    updateForm('company', preeshe ? preeshe.name : compRes.data.data[0].name);
                    defaultForm.company = preeshe ? preeshe.name : compRes.data.data[0].name;
                } else {
                    defaultForm.company = 'Preeshe Consultancy Services';
                }
            } catch (err) { console.error('Masters fetch error:', err); }
        };
        fetchMasters();
    }, []);

    // ─── FETCH LIST ──────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Job Offer?fields=["*"]&limit_page_length=None&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Job Offers' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchData();
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Job Offer/${encodeURIComponent(name)}`);
            const d = res.data?.data || {};
            console.log('Job Offer API response:', d);
            // ERPNext returns child table as 'offer_terms' for Job Offer
            const rawTerms = d.offer_terms || d.terms || [];
            setFormData({
                name: d.name || '',
                job_applicant: d.job_applicant || '',
                applicant_name: d.applicant_name || '',
                applicant_email: d.applicant_email || d.email_id || '',
                offer_date: d.offer_date || new Date().toISOString().split('T')[0],
                designation: d.designation || '',
                company: d.company || '',
                status: d.status || 'Draft',
                job_offer_term_template: d.job_offer_term_template || '',
                terms: rawTerms.map(t => ({
                    offer_term: t.offer_term || '',
                    value: t.value || ''
                })),
                select_terms_and_conditions: d.select_terms_and_conditions || '',
                terms_and_conditions: d.terms_and_conditions || '',
                letter_head: d.letter_head || '',
                print_heading: d.print_heading || ''
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
        }
    };

    // ─── ACTIONS ──────────────────────────────────────────────────
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm, company: defaultForm.company || (companies.length > 0 ? companies[0] : 'Preeshe Consultancy Services') });
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setView('form');
        await fetchSingle(record.name);
    };

    // ─── SAVE ─────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.job_applicant || !formData.offer_date || !formData.company || !formData.designation) {
            notification.warning({ message: 'Please fill all required fields (Job Applicant, Offer Date, Designation, Company)' });
            return;
        }

        // Validate terms
        for (const term of formData.terms) {
            if (!term.offer_term || !term.value) {
                notification.warning({ message: 'Offer Term and Value/Description are required for all terms.' });
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                job_applicant: formData.job_applicant,
                offer_date: formData.offer_date,
                designation: formData.designation,
                company: formData.company,
                status: formData.status,
                job_offer_term_template: formData.job_offer_term_template || null,
                // ERPNext expects 'offer_terms' for Job Offer child table
                offer_terms: formData.terms.map((t, i) => ({
                    offer_term: t.offer_term,
                    value: t.value,
                    idx: i + 1
                })),
                select_terms_and_conditions: formData.select_terms_and_conditions || null,
                terms_and_conditions: formData.terms_and_conditions || null,
                letter_head: formData.letter_head || null,
                print_heading: formData.print_heading || null
            };

            if (editingRecord) {
                await API.put(`/api/resource/Job Offer/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Job Offer updated successfully' });
            } else {
                const res = await API.post('/api/resource/Job Offer', payload);
                const newName = res.data?.data?.name;
                notification.success({ message: `Job Offer ${newName || ''} created successfully` });
            }
            setView('list');
        } catch (err) {
            console.error('Save failed:', err);
            notification.error({ message: `Save failed: ${err.response?.data?.exc || err.message}` });
        } finally { setSaving(false); }
    };

    // ─── DELETE ────────────────────────────────────────────────────
    const handleDelete = async (record) => {
        if (!window.confirm(`Delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Job Offer/${encodeURIComponent(record.name)}`);
            notification.success({ message: `Deleted ${record.name}` });
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
            notification.error({ message: `Delete failed: ${err.response?.data?.exc || err.message}` });
        }
    };

    const updateForm = (key, val) => {
        setFormData(prev => {
            const up = { ...prev, [key]: val };
            if (key === 'job_applicant') {
                const app = jobApplicants.find(j => j.name === val);
                if (app) {
                    up.applicant_name = app.title;
                    up.applicant_email = app.email || '';
                } else {
                    up.applicant_name = '';
                    up.applicant_email = '';
                }
            }
            return up;
        });
    };

    // Child Table Add Row
    const handleAddTerm = () => {
        setFormData(prev => ({
            ...prev,
            terms: [...prev.terms, { offer_term: '', value: '' }]
        }));
    };

    // Child Table Remove Row
    const handleRemoveTerm = (index) => {
        setFormData(prev => {
            const newTerms = [...prev.terms];
            newTerms.splice(index, 1);
            return { ...prev, terms: newTerms };
        });
    };

    // Child Table Update Row
    const handleUpdateTerm = (index, field, value) => {
        setFormData(prev => {
            const newTerms = [...prev.terms];
            newTerms[index][field] = value;
            return { ...prev, terms: newTerms };
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Draft': return 'bg-[#b83b3b] text-white shadow-sm';
            case 'Awaiting Response': return 'bg-yellow-500 text-white shadow-sm';
            case 'Accepted': return 'bg-[#488e52] text-white shadow-sm';
            case 'Rejected': return 'bg-gray-600 text-white shadow-sm';
            case 'Cancelled': return 'bg-[#b83b3b] text-white shadow-sm';
            default: return 'bg-gray-50 text-gray-600 border border-gray-200';
        }
    };

    const handleTCSelect = async (e) => {
        const val = e.target.value;
        updateForm('select_terms_and_conditions', val);
        if (val) {
            try {
                const res = await API.get(`/api/resource/Terms and Conditions/${encodeURIComponent(val)}`);
                if (res.data?.data?.terms) {
                    updateForm('terms_and_conditions', res.data.data.terms);
                }
            } catch (err) {
                console.error("Failed to fetch Terms and Conditions details", err);
            }
        }
    };

    // Fetch template terms
    const handleTemplateSelect = async (e) => {
        const val = e.target.value;
        updateForm('job_offer_term_template', val);
        if (val) {
            try {
                const res = await API.get(`/api/resource/Job Offer Term Template/${encodeURIComponent(val)}`);
                if (res.data?.data?.terms) {
                    // The API returns terms array for the template
                    updateForm('terms', res.data.data.terms.map(t => ({
                        offer_term: t.offer_term || '',
                        value: t.value || ''
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch Template details", err);
            }
        }
    };

    // ─── FILTER ───────────────────────────────────────────────────
    const filtered = data.filter(d => {
        const matchID = !filterID || (d.name || '').toLowerCase().includes(filterID.toLowerCase());
        const matchName = !filterApplicantName || (d.applicant_name || '').toLowerCase().includes(filterApplicantName.toLowerCase());
        const matchStatus = !filterStatus || (d.status || '') === filterStatus;
        const matchDesignation = !filterDesignation || (d.designation || '').toLowerCase().includes(filterDesignation.toLowerCase());
        const matchCompany = !filterCompany || (d.company || '').toLowerCase().includes(filterCompany.toLowerCase());
        return matchID && matchName && matchStatus && matchDesignation && matchCompany;
    });

    const hasActiveFilters = filterID || filterApplicantName || filterStatus || filterDesignation || filterCompany;
    const clearFilters = () => { setFilterID(''); setFilterApplicantName(''); setFilterStatus(''); setFilterDesignation(''); setFilterCompany(''); };

    // ─── PRINT ─────────────────────────────────────────────────────
    const handlePrint = async (record) => {
        try {
            const res = await API.get(`/api/resource/Job Offer/${encodeURIComponent(record.name)}`);
            const d = res.data?.data || {};
            const rawTerms = d.offer_terms || d.terms || [];
            setPrintData({
                name: d.name || '',
                job_applicant: d.job_applicant || '',
                applicant_name: d.applicant_name || '',
                applicant_email: d.applicant_email || d.email_id || '',
                offer_date: d.offer_date || '',
                designation: d.designation || '',
                company: d.company || '',
                status: d.status || '',
                job_offer_term_template: d.job_offer_term_template || '',
                terms: rawTerms.map(t => ({ offer_term: t.offer_term || '', value: t.value || '' })),
                terms_and_conditions: d.terms_and_conditions || '',
                letter_head: d.letter_head || '',
                print_heading: d.print_heading || ''
            });
            setView('print');
            // Trigger print dialog after a brief delay so the DOM renders
            setTimeout(() => window.print(), 500);
        } catch (err) {
            console.error('Print fetch failed:', err);
            notification.error({ message: 'Failed to load Job Offer for printing' });
        }
    };

    // Print current form data directly (when in form view)
    const handlePrintCurrent = () => {
        setPrintData({ ...formData });
        setView('print');
        setTimeout(() => window.print(), 500);
    };

    // ═══════════════════════════════════════════════════════════════
    // ─── PRINT VIEW ───────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    if (view === 'print' && printData) {
        const formatDate = (d) => {
            if (!d) return '';
            const dt = new Date(d);
            return dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };
        return (
            <>
                {/* Print-specific CSS */}
                <style>{`
                    @media print {
                        body * { visibility: hidden !important; }
                        .job-offer-print-area, .job-offer-print-area * { visibility: visible !important; }
                        .job-offer-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
                        .no-print { display: none !important; }
                        @page { size: A4; margin: 15mm 20mm; }
                    }
                `}</style>

                {/* Back / Re-print bar (hidden on print) */}
                <div className="no-print p-4 bg-gray-50 border-b flex items-center gap-3">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={() => setView('list')}>← Back to List</button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700" onClick={() => window.print()}>🖨️ Print Again</button>
                </div>

                {/* Printable Area */}
                <div className="job-offer-print-area" style={{ fontFamily: 'serif', color: '#222', maxWidth: '210mm', margin: '0 auto', padding: '20px 40px' }}>
                    {/* ── Company Letter Head ── */}
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #1a237e', paddingBottom: '16px', marginBottom: '24px' }}>
                        <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px 0', fontFamily: 'sans-serif' }}>
                            {printData.company || 'Company'}
                        </h1>
                        {printData.letter_head && (
                            <p style={{ fontSize: '12px', color: '#555', margin: '2px 0' }}>Letter Head: {printData.letter_head}</p>
                        )}
                    </div>

                    {/* ── Title ── */}
                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0', fontFamily: 'sans-serif' }}>
                            {printData.print_heading || 'Job Offer'}
                        </h2>
                        <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>{printData.name}</p>
                    </div>

                    {/* ── Details Grid ── */}
                    <table style={{ width: '100%', marginBottom: '24px', fontSize: '14px', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '6px 0', color: '#666', width: '180px' }}>Applicant Name:</td>
                                <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{printData.applicant_name}</td>
                                <td style={{ padding: '6px 0', color: '#666', width: '150px' }}>Offer Date:</td>
                                <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{formatDate(printData.offer_date)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '6px 0', color: '#666' }}>Applicant Email Address:</td>
                                <td style={{ padding: '6px 0' }}>{printData.applicant_email}</td>
                                <td style={{ padding: '6px 0', color: '#666' }}>Designation:</td>
                                <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{printData.designation}</td>
                            </tr>
                            {printData.job_offer_term_template && (
                                <tr>
                                    <td style={{ padding: '6px 0', color: '#666' }}>Job Offer Term Template:</td>
                                    <td colSpan="3" style={{ padding: '6px 0' }}>{printData.job_offer_term_template}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* ── Offer Terms Table ── */}
                    {printData.terms && printData.terms.length > 0 && (
                        <table style={{ width: '100%', border: '1px solid #ddd', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                    <th style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', width: '50px' }}>Sr</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', width: '180px' }}>Offer Term</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left' }}>Value / Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {printData.terms.map((term, idx) => (
                                    <tr key={idx}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px 12px', fontWeight: '500' }}>{term.offer_term}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px 12px' }}>{term.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* ── Terms and Conditions ── */}
                    {printData.terms_and_conditions && (
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', fontFamily: 'sans-serif' }}>Terms and Conditions</h3>
                            <div style={{ fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
                                dangerouslySetInnerHTML={{ __html: printData.terms_and_conditions }}
                            />
                        </div>
                    )}

                    {/* ── Footer ── */}
                    <div style={{ marginTop: '40px', fontSize: '12px', color: '#888', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: '12px' }}>
                        This is a system-generated document from {printData.company || 'the company'}.
                    </div>
                </div>
            </>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    if (view === 'form') {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                {/* ── Top bar ── */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-700 text-lg" onClick={() => setView('list')}>←</button>
                        <h1 className="text-xl font-semibold text-gray-800">
                            {editingRecord ? editingRecord.name : 'New Job Offer'}
                        </h1>
                        {editingRecord
                            ? <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(formData.status)}`}>{formData.status}</span>
                            : <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600">Not Saved</span>}
                    </div>
                    <div className="flex gap-2">
                        {editingRecord && (
                            <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded border hover:bg-gray-200 flex items-center gap-1" onClick={handlePrintCurrent}>
                                🖨️ Print
                            </button>
                        )}
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded border hover:bg-gray-200" onClick={() => setView('list')}>Cancel</button>
                        <button className="px-5 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
                <nav className="text-xs text-gray-400 mb-4">
                    <span className="cursor-pointer hover:text-blue-500" onClick={() => setView('list')}>Job Offer</span>
                    <span className="mx-1">›</span>
                    <span>{editingRecord ? editingRecord.name : 'New'}</span>
                </nav>

                {/* ── Card ── */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-6">

                        {/* ── Section 1: Details ── */}
                        <div className="mb-6">
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                {/* LEFT COLUMN */}
                                <div className="flex flex-col gap-5">
                                    {/* Job Applicant */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Job Applicant <span className="text-red-500">*</span></label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-1.5 text-[13px] bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                                            value={formData.job_applicant} onChange={e => updateForm('job_applicant', e.target.value)}>
                                            <option value="">Select Job Applicant...</option>
                                            {jobApplicants.map(j => <option key={j.name} value={j.name}>{j.title}</option>)}
                                        </select>
                                    </div>
                                    {/* Applicant Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Applicant Name</label>
                                        <input type="text" readOnly
                                            className="w-full border border-gray-200 rounded px-3 py-1.5 text-[13px] bg-gray-100 text-gray-600 focus:outline-none"
                                            value={formData.applicant_name} placeholder="" />
                                    </div>
                                    {/* Applicant Email Address */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Applicant Email Address</label>
                                        <input type="text" readOnly
                                            className="w-full border border-gray-200 rounded px-3 py-1.5 text-[13px] bg-gray-100 text-gray-600 focus:outline-none"
                                            value={formData.applicant_email} placeholder="" />
                                    </div>
                                </div>

                                {/* RIGHT COLUMN */}
                                <div className="flex flex-col gap-5">
                                    {/* Status */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-1.5 text-[13px] bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors font-medium text-gray-700"
                                            value={formData.status} onChange={e => updateForm('status', e.target.value)}>
                                            <option value="Awaiting Response">Awaiting Response</option>
                                            <option value="Accepted">Accepted</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>
                                    {/* Offer Date */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Offer Date <span className="text-red-500">*</span></label>
                                        <input type="date"
                                            className="w-full border border-gray-200 rounded px-3 py-1.5 text-[13px] bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                                            value={formData.offer_date} onChange={e => updateForm('offer_date', e.target.value)} />
                                    </div>
                                    {/* Designation */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Designation <span className="text-red-500">*</span></label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-1.5 text-[13px] bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                                            value={formData.designation} onChange={e => updateForm('designation', e.target.value)}>
                                            <option value="">Select Designation...</option>
                                            {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    {/* Company */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Company <span className="text-red-500">*</span></label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-1.5 text-[13px] bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors font-semibold"
                                            value={formData.company} onChange={e => updateForm('company', e.target.value)}>
                                            <option value="">Select Company...</option>
                                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 2: Job Offer Terms ── */}
                        <div className="border-t border-gray-200 pt-5 mb-6">
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5 mb-5">
                                <div className="flex flex-col gap-1">
                                    <label className="block text-xs font-semibold text-gray-500">Job Offer Term Template</label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-1.5 text-[13px] bg-gray-50 focus:outline-none focus:border-blue-400 font-medium text-gray-700"
                                        value={formData.job_offer_term_template} onChange={handleTemplateSelect}>
                                        <option value="">Select Template...</option>
                                        {offerTermTemplates.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <h3 className="text-xs font-semibold text-gray-500 mb-3">Job Offer Terms</h3>

                            {/* Terms Table */}
                            <div className="overflow-x-auto border border-gray-200 rounded">
                                <table className="w-full text-[13px]">
                                    <thead className="bg-[#f3f4f6] text-gray-500 border-b">
                                        <tr>
                                            <th className="px-3 py-2 text-left w-8"><input type="checkbox" className="rounded border-gray-300" /></th>
                                            <th className="px-3 py-2 text-left font-semibold w-12">No.</th>
                                            <th className="px-3 py-2 text-left font-semibold">Offer Term <span className="text-red-500">*</span></th>
                                            <th className="px-3 py-2 text-left font-semibold">Value / Description <span className="text-red-500">*</span></th>
                                            <th className="px-3 py-2 text-center font-semibold w-12">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.terms.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                                                    No Data
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.terms.map((term, idx) => (
                                                <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                                                    <td className="px-3 py-2"><input type="checkbox" className="rounded border-gray-300" /></td>
                                                    <td className="px-3 py-2 text-center text-gray-600">{idx + 1}</td>
                                                    <td className="px-3 py-2 font-medium text-gray-800">
                                                        <input
                                                            type="text"
                                                            className="w-full border border-transparent hover:border-gray-300 focus:border-blue-400 rounded px-2 py-1 text-[13px] bg-transparent focus:bg-white focus:outline-none transition-colors"
                                                            value={term.offer_term || ''}
                                                            onChange={e => handleUpdateTerm(idx, 'offer_term', e.target.value)}
                                                            placeholder="Enter offer term..."
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-600">
                                                        <input
                                                            type="text"
                                                            className="w-full border border-transparent hover:border-gray-300 focus:border-blue-400 rounded px-2 py-1 text-[13px] bg-transparent focus:bg-white focus:outline-none transition-colors"
                                                            value={term.value || ''}
                                                            onChange={e => handleUpdateTerm(idx, 'value', e.target.value)}
                                                            placeholder="Enter value/description..."
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-center align-middle">
                                                        <button className="text-gray-400 hover:text-red-500" title="Remove row" onClick={() => handleRemoveTerm(idx)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                                <div className="bg-white px-3 py-2 text-[12px] font-semibold border-t">
                                    <button className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 uppercase" onClick={handleAddTerm}>Add Row</button>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Terms and Conditions ── */}
                        <div className="border-t border-gray-200 pt-5 mb-6">
                            <div className="grid grid-cols-1 gap-y-5">
                                <div className="w-1/2 pr-5">
                                    <label className="block text-sm text-gray-600 mb-1">Select Terms and Conditions</label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.select_terms_and_conditions} onChange={handleTCSelect}>
                                        <option value="">Select Terms and Conditions...</option>
                                        {termsAndConditions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Terms and Conditions</label>
                                    {/* Usually a rich text editor. Using textarea for simplicity as ERPNext converts to HTML */}
                                    <div className="border border-gray-200 rounded-md overflow-hidden flex flex-col">
                                        {/* Fake Toolbar */}
                                        <div className="bg-white border-b border-gray-200 px-2 py-1 flex items-center gap-1 text-gray-600 text-xs">
                                            <button className="p-1 hover:bg-gray-100 rounded font-bold">B</button>
                                            <button className="p-1 hover:bg-gray-100 rounded italic">I</button>
                                            <button className="p-1 hover:bg-gray-100 rounded underline">U</button>
                                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                            <button className="p-1 hover:bg-gray-100 rounded">Format</button>
                                            <button className="p-1 hover:bg-gray-100 rounded">Tools</button>
                                        </div>
                                        <textarea
                                            className="w-full px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:bg-white min-h-[250px] resize-y"
                                            value={formData.terms_and_conditions}
                                            onChange={e => updateForm('terms_and_conditions', e.target.value)}
                                            placeholder="Terms and Conditions..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 4: Printing Details ── */}
                        <div className="border-t border-gray-200 pt-5">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Printing Details</h3>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Letter Head</label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.letter_head} onChange={e => updateForm('letter_head', e.target.value)}>
                                        <option value="">Select Letter Head...</option>
                                        {letterHeads.map(lh => <option key={lh} value={lh}>{lh}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Print Heading</label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.print_heading} onChange={e => updateForm('print_heading', e.target.value)}>
                                        <option value="">Select Print Heading...</option>
                                        <option value="Credit Note">Credit Note</option>
                                        <option value="Debit Note">Debit Note</option>
                                        <option disabled>──────────</option>
                                        <option value="+ Create a new Print Heading" disabled>+ Create a new Print Heading</option>
                                        <option value="Advanced Search" disabled>Q Advanced Search</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // ─── LIST VIEW ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="p-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Job Offer</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700" onClick={handleNew}>
                        + Add Job Offer
                    </button>
                </div>
            </div>

            {/* ── Filter Bar (Appraisal-style horizontal filters) ── */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-48" placeholder="Search ID..." value={filterID} onChange={e => setFilterID(e.target.value)} />
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-48" placeholder="Applicant Name..." value={filterApplicantName} onChange={e => setFilterApplicantName(e.target.value)} />
                <select className="border border-gray-300 rounded px-3 py-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="Awaiting Response">Awaiting Response</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                </select>
                {hasActiveFilters && (<button className="text-red-500 hover:text-red-700 text-sm" onClick={clearFilters}>✕ Clear Filters</button>)}
                <div className="ml-auto text-xs text-gray-400">{filtered.length} of {data.length}</div>
            </div>

            {/* ── Data Table ── */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500">
                        <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading from ERPNext...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-[#f3f4f6] border-b text-gray-500">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[13px] w-12"><input type="checkbox" className="rounded border-gray-300" /></th>
                                    <th className="text-left px-4 py-3 font-semibold text-[13px]">ID</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[13px]">Applicant Name</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[13px]">Status</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[13px]">Designation</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[13px]">Company</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[13px] w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-12 text-gray-500">
                                            <p className="text-lg mb-2">No Job Offers found</p>
                                            <p className="text-sm">Click "+ Add Job Offer" to create one</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((row, i) => (
                                        <tr key={row.name} className="border-b border-gray-100 hover:bg-gray-50 group">
                                            <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                                            <td className="px-4 py-3 text-blue-600 text-xs font-medium cursor-pointer hover:underline" onClick={() => handleEdit(row)}>{row.name}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800 cursor-pointer" onClick={() => handleEdit(row)}>
                                                {row.applicant_name || row.job_applicant || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${getStatusColor(row.status)}`}>
                                                    {row.status || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{row.designation || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600">{row.company || '-'}</td>
                                            <td className="px-4 py-3 flex justify-end gap-3">
                                                <button className="text-gray-400 hover:text-green-600" title="Print" onClick={() => handlePrint(row)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                                </button>
                                                <button className="text-gray-400 hover:text-blue-600" onClick={() => handleEdit(row)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </button>
                                                <button className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(row)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {!loading && (
                <div className="mt-3 text-xs text-gray-400 flex justify-between">
                    <span>Total: {data.length} records</span>
                    <span>Source: ERPNext → /api/resource/Job Offer</span>
                </div>
            )}
        </div>
    );
}
