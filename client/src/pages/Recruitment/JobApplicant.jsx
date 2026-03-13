import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function JobApplicant() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [connectionsOpen, setConnectionsOpen] = useState(true);
    const [interviewSummaryOpen, setInterviewSummaryOpen] = useState(true);

    // Resume parsing state
    const [parsing, setParsing] = useState(false);
    const [parsedData, setParsedData] = useState(null);
    const [parsedSectionOpen, setParsedSectionOpen] = useState(true);

    // Linked data (fetched when editing)
    const [interviews, setInterviews] = useState([]);
    const [linkedJobOffers, setLinkedJobOffers] = useState([]);
    const [linkedEmployees, setLinkedEmployees] = useState([]);
    const [linkedOnboarding, setLinkedOnboarding] = useState([]);
    const [linkedAppointmentLetters, setLinkedAppointmentLetters] = useState([]);
    const [loadingLinked, setLoadingLinked] = useState(false);

    // Bulk Excel Upload state
    const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(0);
    const [bulkLogs, setBulkLogs] = useState([]);

    // Master data
    const [designations, setDesignations] = useState([]);
    const [jobOpenings, setJobOpenings] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [countries, setCountries] = useState([]);
    const [sources, setSources] = useState([]);

    // Form data
    const defaultForm = {
        name: '',
        applicant_name: '',
        email_id: '',
        phone_number: '',
        job_title: '',
        designation: '',
        status: 'Open',
        country: 'India',
        source: '',
        rating: 0,
        cover_letter: '',
        resume_attachment: '',
        resume_link: '',
        currency: 'INR',
        lower_range: '',
        upper_range: '',
        notes: '',
        custom_personal_info__summary: '',
        custom_education__experience: ''
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH MASTERS ────────────────────────────────────────────
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [desigRes, joRes, currRes, countryRes, sourceRes] = await Promise.all([
                    API.get('/api/resource/Designation?fields=["name"]&limit_page_length=None&order_by=name asc'),
                    API.get('/api/resource/Job Opening?fields=["name","job_title"]&limit_page_length=None&order_by=modified desc').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Currency?fields=["name"]&limit_page_length=None&order_by=name asc'),
                    API.get('/api/resource/Country?fields=["name"]&limit_page_length=None&order_by=name asc'),
                    API.get('/api/resource/Source?fields=["name"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
                ]);
                setDesignations((desigRes.data?.data || []).map(d => d.name));
                setJobOpenings((joRes.data?.data || []).map(d => ({ name: d.name, job_title: d.job_title })));
                setCurrencies((currRes.data?.data || []).map(d => d.name));
                setCountries((countryRes.data?.data || []).map(d => d.name));
                setSources((sourceRes.data?.data || []).map(d => d.name));
            } catch (err) { console.error('Masters fetch error:', err); }
        };
        fetchMasters();
    }, []);

    // ─── FETCH LIST ──────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Job Applicant?fields=["*"]&limit_page_length=None&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Job Applicants' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchData();
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Job Applicant/${encodeURIComponent(name)}`);
            const d = res.data?.data || {};
            setFormData({
                name: d.name || '',
                applicant_name: d.applicant_name || '',
                email_id: d.email_id || '',
                phone_number: d.phone_number || '',
                job_title: d.job_title || '',
                designation: d.designation || '',
                status: d.status || 'Open',
                country: d.country || 'India',
                source: d.source || '',
                rating: d.rating || 0,
                cover_letter: d.cover_letter || '',
                resume_attachment: d.resume_attachment || '',
                resume_link: d.resume_link || '',
                currency: d.currency || 'INR',
                lower_range: d.lower_range || '',
                upper_range: d.upper_range || '',
                notes: d.notes || '',
                custom_personal_info__summary: d.custom_personal_info__summary || '',
                custom_education__experience: d.custom_education__experience || ''
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
        }
    };

    // ─── FETCH LINKED DATA (interviews, connections) ──────────────
    const fetchLinkedData = async (applicantName) => {
        setLoadingLinked(true);
        try {
            const [interviewRes, jobOfferRes, empRes, onboardRes, appointRes] = await Promise.all([
                API.get(`/api/resource/Interview?filters=[["job_applicant","=","${encodeURIComponent(applicantName)}"]]&fields=["*"]&limit_page_length=None&order_by=scheduled_on desc`).catch(() => ({ data: { data: [] } })),
                API.get(`/api/resource/Job Offer?filters=[["job_applicant","=","${encodeURIComponent(applicantName)}"]]&fields=["name","status","offer_date","designation"]&limit_page_length=None`).catch(() => ({ data: { data: [] } })),
                API.get(`/api/resource/Employee?filters=[["job_applicant","=","${encodeURIComponent(applicantName)}"]]&fields=["name","employee_name","status"]&limit_page_length=None`).catch(() => ({ data: { data: [] } })),
                API.get(`/api/resource/Employee Onboarding?filters=[["job_applicant","=","${encodeURIComponent(applicantName)}"]]&fields=["name","employee_name","boarding_status"]&limit_page_length=None`).catch(() => ({ data: { data: [] } })),
                API.get(`/api/resource/Appointment Letter?filters=[["job_applicant","=","${encodeURIComponent(applicantName)}"]]&fields=["name","applicant_name"]&limit_page_length=None`).catch(() => ({ data: { data: [] } })),
            ]);
            setInterviews(interviewRes.data?.data || []);
            setLinkedJobOffers(jobOfferRes.data?.data || []);
            setLinkedEmployees(empRes.data?.data || []);
            setLinkedOnboarding(onboardRes.data?.data || []);
            setLinkedAppointmentLetters(appointRes.data?.data || []);
        } catch (err) {
            console.error('Linked data fetch error:', err);
        } finally { setLoadingLinked(false); }
    };

    // ─── ACTIONS ──────────────────────────────────────────────────
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        setInterviews([]);
        setLinkedJobOffers([]);
        setLinkedEmployees([]);
        setLinkedOnboarding([]);
        setLinkedAppointmentLetters([]);
        setParsedData(null);
        setView('form');
    };

    // ─── RESUME PARSE ─────────────────────────────────────────────
    const handleResumeUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(ext)) {
            notification.error({ message: 'Only PDF, DOC, DOCX and TXT files are allowed' });
            return;
        }

        setParsing(true);
        setParsedData(null);
        updateForm('resume_attachment', file.name);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const res = await axios.post('/local-api/resume-parser', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data?.success && res.data?.data) {
                const parsed = res.data.data;
                setParsedData(parsed);

                // Auto-fill form fields from parsed data
                if (parsed.name && !formData.applicant_name) {
                    updateForm('applicant_name', parsed.name.trim());
                }
                if (parsed.email && !formData.email_id) {
                    updateForm('email_id', parsed.email.trim());
                }
                if (parsed.phone && !formData.phone_number) {
                    updateForm('phone_number', parsed.phone.trim());
                }

                // Build Personal Info & Summary (from name, email, phone, summary, and objective)
                const summaryParts = [];
                const personalDetails = [];
                if (parsed.name) personalDetails.push(`Name: ${parsed.name.trim()}`);
                if (parsed.email) personalDetails.push(`Email: ${parsed.email.trim()}`);
                if (parsed.phone) personalDetails.push(`Phone: ${parsed.phone.trim()}`);
                if (personalDetails.length > 0) {
                    summaryParts.push('PERSONAL INFO:\n' + personalDetails.join('\n'));
                }
                
                if (parsed.summary) summaryParts.push('SUMMARY:\n' + parsed.summary.trim());
                if (parsed.objective) summaryParts.push('OBJECTIVE:\n' + parsed.objective.trim());
                if (summaryParts.length > 0 && !formData.custom_personal_info__summary) {
                    updateForm('custom_personal_info__summary', summaryParts.join('\n\n'));
                }

                // Build Education & Experience 
                const eduExpParts = [];
                if (parsed.education) eduExpParts.push('EDUCATION:\n' + parsed.education.trim());
                if (parsed.experience) eduExpParts.push('EXPERIENCE:\n' + parsed.experience.trim());
                if (eduExpParts.length > 0 && !formData.custom_education__experience) {
                    updateForm('custom_education__experience', eduExpParts.join('\n\n'));
                }

                // Build Notes (from skills, projects, certifications)
                const notesParts = [];
                if (parsed.skills) notesParts.push('SKILLS:\n' + parsed.skills.trim());
                if (parsed.projects) notesParts.push('PROJECTS:\n' + parsed.projects.trim());
                if (parsed.certification) notesParts.push('CERTIFICATIONS:\n' + parsed.certification.trim());
                if (notesParts.length > 0 && !formData.notes) {
                    updateForm('notes', notesParts.join('\n\n'));
                }

                notification.success({ message: 'Resume parsed successfully! Fields auto-filled.' });
            } else {
                notification.warning({ message: 'Resume uploaded but no data could be extracted' });
            }
        } catch (error) {
            console.error('Resume parse error:', error);
            notification.error({ message: 'Failed to parse resume. Make sure the parser server is running on port 3636.' });
        } finally {
            setParsing(false);
            // Reset file input
            e.target.value = '';
        }
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setView('form');
        await fetchSingle(record.name);
        await fetchLinkedData(record.name);
    };

    // ─── SAVE ─────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.applicant_name || !formData.email_id) {
            notification.warning({ message: 'Please fill all required fields (Applicant Name, Email Address)' });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                applicant_name: formData.applicant_name,
                email_id: formData.email_id,
                phone_number: formData.phone_number || null,
                job_title: formData.job_title || null,
                designation: formData.designation || null,
                status: formData.status,
                country: formData.country || null,
                source: formData.source || null,
                rating: formData.rating || 0,
                cover_letter: formData.cover_letter || null,
                resume_link: formData.resume_link || null,
                currency: formData.currency || 'INR',
                notes: formData.notes ? formData.notes.substring(0, 140) : null,
                custom_personal_info__summary: formData.custom_personal_info__summary || null,
                custom_education__experience: formData.custom_education__experience || null
            };

            if (formData.lower_range) {
                payload.lower_range = parseFloat(formData.lower_range);
            }
            if (formData.upper_range) {
                payload.upper_range = parseFloat(formData.upper_range);
            }

            if (editingRecord) {
                await API.put(`/api/resource/Job Applicant/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Job Applicant updated successfully' });
            } else {
                const res = await API.post('/api/resource/Job Applicant', payload);
                const newName = res.data?.data?.name;
                notification.success({ message: `Job Applicant ${newName || ''} created successfully` });
            }
            setView('list');
        } catch (err) {
            console.error('Save failed:', err.response?.data || err);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.response?.data?.exc || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try {
                    const parsed = JSON.parse(errMsg);
                    errMsg = parsed.map(m => {
                        try { return JSON.parse(m).message; } catch { return m; }
                    }).join('\n');
                } catch { /* */ }
            }
            notification.error({
                message: 'Save Failed',
                description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
                duration: 8
            });
        } finally { setSaving(false); }
    };

    // ─── DELETE ────────────────────────────────────────────────────
    const handleDelete = async (record) => {
        if (!window.confirm(`Delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Job Applicant/${encodeURIComponent(record.name)}`);
            notification.success({ message: `Deleted ${record.name}` });
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
            notification.error({ message: `Delete failed: ${err.response?.data?.exc || err.message}` });
        }
    };

    // ─── BULK UPLOAD ──────────────────────────────────────────────
    const bulkTemplateColumns = [
        "applicant_name", "email_id", "phone_number", "job_title", 
        "designation", "status", "country", "resume_link"
    ];

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([bulkTemplateColumns]);
        
        // Dynamically get actual records if available, otherwise fallback
        const dummyJob = jobOpenings?.length > 0 ? jobOpenings[0].name : "Software Engineer";
        const dummyDesig = designations?.length > 0 ? designations[0].name : "Developer";

        // Add one dummy row as example
        XLSX.utils.sheet_add_aoa(ws, [[
            "John Doe", "john.doe@example.com", "9876543210", 
            dummyJob, dummyDesig, "Open", "India", "https://linkedin.com/in/johndoe"
        ]], { origin: -1 });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "JobApplicants");
        XLSX.writeFile(wb, "JobApplicant_Bulk_Template.xlsx");
    };

    const processBulkFile = async () => {
        if (!bulkFile) {
            notification.error({ message: "Please select an Excel file first." });
            return;
        }

        setBulkUploading(true);
        setBulkProgress(0);
        setBulkLogs([]);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (jsonData.length === 0) {
                    notification.error({ message: "File is empty or invalid format." });
                    setBulkUploading(false);
                    return;
                }

                let successCount = 0;
                let failCount = 0;
                const total = jsonData.length;
                const newLogs = [];

                for (let i = 0; i < total; i++) {
                    const row = jsonData[i];
                    const rowNum = i + 2; // Excel row number (1-indexed + header)

                    try {
                        if (!row.applicant_name || !row.email_id) {
                            throw new Error("Missing mandatory fields: 'applicant_name' or 'email_id'");
                        }

                        // Prepare payload, explicitly excluding any blank attributes
                        const payload = {};
                        Object.keys(row).forEach(key => {
                            if (row[key] !== "") {
                                payload[key] = (typeof row[key] === 'number') ? String(row[key]) : row[key];
                            }
                        });

                        // Ensure default logical statuses
                        if (!payload.status) payload.status = "Open";

                        // Send create request
                        await API.post('/api/resource/Job Applicant', payload);

                        successCount++;
                        newLogs.unshift({ type: 'success', msg: `Row ${rowNum}: Successfully created ${row.applicant_name}` });
                    } catch (error) {
                        failCount++;
                        let errMsg = error.response?.data?._server_messages || error.response?.data?.exc || error.message;
                        if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                            try {
                                const parsed = JSON.parse(errMsg);
                                errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join(' | ');
                            } catch { /* ignore */ }
                        }
                        newLogs.unshift({ type: 'error', msg: `Row ${rowNum}: Failed (${row.applicant_name || 'Unknown'}) - ${typeof errMsg === 'string' ? errMsg.substring(0, 100) : 'Error'}` });
                    }

                    setBulkProgress(Math.round(((i + 1) / total) * 100));
                    setBulkLogs([...newLogs]);
                }

                notification.success({ message: `Bulk Upload Complete. Success: ${successCount}, Failed: ${failCount}` });
                fetchData(); // Refresh list to show newly created applicants
            } catch (err) {
                console.error(err);
                notification.error({ message: "Failed to parse file." });
            } finally {
                setBulkUploading(false);
                setBulkFile(null); // Clear file after processing
            }
        };

        reader.readAsArrayBuffer(bulkFile);
    };

    // ─── FORM HELPERS ─────────────────────────────────────────────
    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'bg-blue-50 text-blue-600';
            case 'Replied': return 'bg-cyan-50 text-cyan-600';
            case 'Accepted': return 'bg-green-50 text-green-600';
            case 'Rejected': return 'bg-red-50 text-red-600';
            case 'Hold': return 'bg-yellow-50 text-yellow-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    // Star rating component
    const StarRating = ({ value, onChange, readOnly = false }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button"
                    className={`text-xl ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
                    onClick={() => !readOnly && onChange(star === value ? 0 : star)}
                    disabled={readOnly}>
                    {star <= value
                        ? <span className="text-yellow-400">★</span>
                        : <span className="text-gray-300">★</span>}
                </button>
            ))}
        </div>
    );

    // ─── FILTER ───────────────────────────────────────────────────
    const filtered = data.filter(d =>
        (d.name || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.applicant_name || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.email_id || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.job_title || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.designation || '').toLowerCase().includes(searchId.toLowerCase())
    );

    const hasActiveFilters = searchId !== '';
    const clearFilters = () => { setSearchId(''); };

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
                            {editingRecord ? editingRecord.name : 'New Job Applicant'}
                        </h1>
                        {editingRecord
                            ? <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(formData.status)}`}>{formData.status}</span>
                            : <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600">Not Saved</span>}
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded border hover:bg-gray-200" onClick={() => setView('list')}>Cancel</button>
                        <button className="px-5 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
                <nav className="text-xs text-gray-400 mb-4">
                    <span className="cursor-pointer hover:text-blue-500" onClick={() => setView('list')}>Job Applicant</span>
                    <span className="mx-1">›</span>
                    <span>{editingRecord ? editingRecord.name : 'New'}</span>
                </nav>

                {/* ── Card ── */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

                    {/* ── Connections (edit mode only) ── */}
                    {editingRecord && (
                        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                            <button
                                className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3 hover:text-gray-600"
                                onClick={() => setConnectionsOpen(!connectionsOpen)}>
                                <span>Connections</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${connectionsOpen ? '' : '-rotate-90'}`}>
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {connectionsOpen && (
                                <div className="flex flex-wrap gap-4">
                                    {/* Employee connection */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-50 text-sm text-gray-700 border border-gray-200">
                                        {linkedEmployees.length > 0 && (
                                            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">{linkedEmployees.length}</span>
                                        )}
                                        <span>Employee</span>
                                        <span className="text-gray-400 cursor-pointer hover:text-blue-600">+</span>
                                    </div>
                                    {/* Job Offer connection */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-50 text-sm text-gray-700 border border-gray-200">
                                        {linkedJobOffers.length > 0 && (
                                            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">{linkedJobOffers.length}</span>
                                        )}
                                        <span>Job Offer</span>
                                        <span className="text-gray-400 cursor-pointer hover:text-blue-600">+</span>
                                    </div>
                                    {/* Interview connection */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-50 text-sm text-gray-700 border border-gray-200">
                                        {interviews.length > 0 && (
                                            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">{interviews.length}</span>
                                        )}
                                        <span>Interview</span>
                                        <span className="text-gray-400 cursor-pointer hover:text-blue-600">+</span>
                                    </div>
                                    {/* Employee Onboarding connection */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-50 text-sm text-gray-700 border border-gray-200">
                                        {linkedOnboarding.length > 0 && (
                                            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">{linkedOnboarding.length}</span>
                                        )}
                                        <span>Employee Onboarding</span>
                                    </div>
                                    {/* Appointment Letter connection */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-50 text-sm text-gray-700 border border-gray-200">
                                        {linkedAppointmentLetters.length > 0 && (
                                            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">{linkedAppointmentLetters.length}</span>
                                        )}
                                        <span>Appointment Letter</span>
                                        <span className="text-gray-400 cursor-pointer hover:text-blue-600">+</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-6">

                        {/* ── Interview Summary (collapsible) ── */}
                        <div className="mb-6">
                            <button
                                className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3 hover:text-gray-600"
                                onClick={() => setInterviewSummaryOpen(!interviewSummaryOpen)}>
                                <span>Interview Summary</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${interviewSummaryOpen ? '' : '-rotate-90'}`}>
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {interviewSummaryOpen && (
                                loadingLinked ? (
                                    <div className="bg-gray-50 rounded px-4 py-3 text-sm text-gray-400 border border-gray-200">
                                        Loading interview data...
                                    </div>
                                ) : interviews.length === 0 ? (
                                    <div className="bg-gray-50 rounded px-4 py-3 text-sm text-gray-500 border border-gray-200">
                                        No Interview has been scheduled.
                                    </div>
                                ) : (
                                    <div className="border border-gray-200 rounded overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Interview</th>
                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Interview Round</th>
                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Rating</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {interviews.map(iv => {
                                                    const rating = Math.round(parseFloat(iv.average_rating || iv.rating) || 0);
                                                    return (
                                                        <tr key={iv.name} className="border-b last:border-b-0 hover:bg-gray-50">
                                                            <td className="px-4 py-2 text-blue-600 font-medium">{iv.name}</td>
                                                            <td className="px-4 py-2">{iv.interview_round || '-'}</td>
                                                            <td className="px-4 py-2">{iv.scheduled_on ? new Date(iv.scheduled_on).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</td>
                                                            <td className="px-4 py-2">{iv.status || '-'}</td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex gap-0.5">
                                                                    {[1, 2, 3, 4, 5].map(s => (
                                                                        <span key={s} className={`text-base ${s <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}
                        </div>

                        {/* ── Section 1: Details ── */}
                        <div className="border-t border-gray-200 pt-5 mb-6">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Details</h3>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                {/* Applicant Name */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Applicant Name <span className="text-red-500">*</span></label>
                                    <input type="text"
                                        className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                        value={formData.applicant_name} onChange={e => updateForm('applicant_name', e.target.value)}
                                        placeholder="" />
                                </div>

                                {/* Job Opening */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Job Opening</label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.job_title} onChange={e => updateForm('job_title', e.target.value)}>
                                        <option value="">Select Job Opening...</option>
                                        {jobOpenings.map(j => <option key={j.name} value={j.name}>{j.job_title || j.name}</option>)}
                                    </select>
                                </div>

                                {/* Email Address */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Email Address <span className="text-red-500">*</span></label>
                                    <input type="email"
                                        className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                        value={formData.email_id} onChange={e => updateForm('email_id', e.target.value)}
                                        placeholder="" />
                                </div>

                                {/* Designation */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Designation</label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.designation} onChange={e => updateForm('designation', e.target.value)}>
                                        <option value="">Select Designation...</option>
                                        {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                                    <input type="text"
                                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.phone_number} onChange={e => updateForm('phone_number', e.target.value)}
                                        placeholder="" />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Status <span className="text-red-500">*</span></label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.status} onChange={e => updateForm('status', e.target.value)}>
                                        <option value="Open">Open</option>
                                        <option value="Replied">Replied</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Hold">Hold</option>
                                        <option value="Accepted">Accepted</option>
                                    </select>
                                </div>

                                {/* Country */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Country</label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.country} onChange={e => updateForm('country', e.target.value)}>
                                        <option value="">Select Country...</option>
                                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 2: Source and Rating ── */}
                        <div className="border-t border-gray-200 pt-5 mb-6">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Source and Rating</h3>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Source</label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.source} onChange={e => updateForm('source', e.target.value)}>
                                        <option value="">Select Source...</option>
                                        {sources.length > 0 ? (
                                            sources.map(s => <option key={s} value={s}>{s}</option>)
                                        ) : (
                                            <>
                                                <option value="Website">Website</option>
                                                <option value="Walk In">Walk In</option>
                                                <option value="Employee Referral">Employee Referral</option>
                                                <option value="Campaign">Campaign</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Applicant Rating</label>
                                    <div className="pt-1">
                                        <StarRating value={formData.rating} onChange={(val) => updateForm('rating', val)} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">1/5 rating scale</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Resume Upload & Parse ── */}
                        <div className="border-t border-gray-200 pt-5 mb-6">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Resume</h3>

                            {/* Upload & Parse Button */}
                            <div className="mb-5">
                                <div className="flex items-center gap-4">
                                    <label className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow cursor-pointer
                                        ${parsing
                                            ? 'bg-gray-100 text-gray-400 cursor-wait shadow-none border border-gray-200'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-md'}`}>
                                        {parsing ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Parsing Resume...</span>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                                <span>Upload & Parse Resume</span>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt"
                                            onChange={handleResumeUpload} disabled={parsing} />
                                    </label>

                                    {formData.resume_attachment && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                            </svg>
                                            <span className="text-sm text-green-700 font-medium">{formData.resume_attachment}</span>
                                            <button type="button" className="text-red-400 hover:text-red-600 text-xs ml-1"
                                                onClick={() => { updateForm('resume_attachment', ''); setParsedData(null); }}>✕</button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Supported formats: PDF, DOC, DOCX, TXT (max 10MB). File will be parsed to auto-fill fields.</p>
                            </div>

                            {/* Parsed Data Preview */}
                            {parsedData && Object.keys(parsedData).length > 0 && (
                                <div className="mb-5">
                                    <button
                                        className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3 hover:text-gray-600"
                                        onClick={() => setParsedSectionOpen(!parsedSectionOpen)}>
                                        <span>📄 Parsed Resume Data</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${parsedSectionOpen ? '' : '-rotate-90'}`}>
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                    {parsedSectionOpen && (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 max-h-[400px] overflow-y-auto">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {Object.entries(parsedData).map(([key, value]) => (
                                                    <div key={key} className={`bg-white rounded-lg p-3 border border-blue-100 shadow-sm ${typeof value === 'string' && value.length > 100 ? 'md:col-span-2' : ''}`}>
                                                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</div>
                                                        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                                                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value).substring(0, 500)}
                                                            {typeof value === 'string' && value.length > 500 && <span className="text-gray-400">... (truncated)</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cover Letter */}
                            <div className="mb-4">
                                <label className="block text-sm text-gray-600 mb-1">Cover Letter</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 min-h-[180px]"
                                    rows={8}
                                    value={formData.cover_letter}
                                    onChange={e => updateForm('cover_letter', e.target.value)}
                                    placeholder=""
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Resume Link</label>
                                    <input type="text"
                                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.resume_link} onChange={e => updateForm('resume_link', e.target.value)}
                                        placeholder="" />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 4: Salary Expectation ── */}
                        <div className="border-t border-gray-200 pt-5 mb-6">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Salary Expectation</h3>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Currency</label>
                                    <select className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                        value={formData.currency} onChange={e => updateForm('currency', e.target.value)}>
                                        <option value="">Select Currency...</option>
                                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Lower Range</label>
                                    <input type="number" min="0"
                                        className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                        value={formData.lower_range} onChange={e => updateForm('lower_range', e.target.value)}
                                        placeholder="" />
                                </div>
                                <div></div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Upper Range</label>
                                    <input type="number" min="0"
                                        className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                        value={formData.upper_range} onChange={e => updateForm('upper_range', e.target.value)}
                                        placeholder="" />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 5: Additional Fields ── */}
                        <div className="border-t border-gray-200 pt-5">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Personal info & Summary</h3>
                            <textarea
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 min-h-[120px] mb-6"
                                rows={5}
                                value={formData.custom_personal_info__summary}
                                onChange={e => updateForm('custom_personal_info__summary', e.target.value)}
                                placeholder=""
                            />

                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Education & Experience</h3>
                            <textarea
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 min-h-[120px] mb-6"
                                rows={5}
                                value={formData.custom_education__experience}
                                onChange={e => updateForm('custom_education__experience', e.target.value)}
                                placeholder=""
                            />

                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Notes</h3>
                            <textarea
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 min-h-[120px]"
                                rows={5}
                                value={formData.notes}
                                onChange={e => updateForm('notes', e.target.value)}
                                placeholder="Add notes..."
                            />
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
                <h1 className="text-2xl font-semibold text-gray-800">Job Applicant</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className={`px-4 py-2 text-sm rounded border transition-colors ${bulkUploadOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`} 
                            onClick={() => setBulkUploadOpen(!bulkUploadOpen)}>
                        📥 Excel Bulk Upload
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700" onClick={handleNew}>
                        + Add Job Applicant
                    </button>
                </div>
            </div>

            {/* ── Bulk Upload Panel ── */}
            {bulkUploadOpen && (
                <div className="mb-6 p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-indigo-900">Bulk Upload via Excel</h2>
                        <button className="text-gray-400 hover:text-gray-600" onClick={() => setBulkUploadOpen(false)}>✕</button>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Instructions */}
                        <div className="flex-1 bg-white p-4 rounded-lg border border-indigo-50">
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">Instructions</h3>
                            <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
                                <li>Download the template using the button below.</li>
                                <li><strong className="text-red-500">applicant_name</strong> and <strong className="text-red-500">email_id</strong> are mandatory.</li>
                                <li>Leave columns blank if you don't want to provide them.</li>
                                <li>Supported Formats: .xlsx, .xls</li>
                            </ul>
                            <button className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
                                    onClick={handleDownloadTemplate}>
                                ⬇ Download Template
                            </button>
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1 bg-white p-4 rounded-lg border border-indigo-50 flex flex-col justify-center">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Filled Template</label>
                            <input type="file" accept=".xlsx,.xls" 
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer mb-4"
                                onChange={(e) => setBulkFile(e.target.files[0])}
                                disabled={bulkUploading}
                            />
                            
                            {bulkFile && (
                                <button className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow flex items-center justify-center gap-2"
                                        onClick={processBulkFile} disabled={bulkUploading}>
                                    {bulkUploading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Processing {bulkProgress}%
                                        </>
                                    ) : '🚀 Start Upload'}
                                </button>
                            )}
                            
                            {/* Progress bar */}
                            {bulkUploading && (
                                <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${bulkProgress}%` }}></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logs */}
                    {bulkLogs.length > 0 && (
                        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Upload Logs</h4>
                            <div className="space-y-1">
                                {bulkLogs.map((log, idx) => (
                                    <div key={idx} className={`text-xs px-2 py-1 rounded ${log.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                        {log.msg}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Filter Bar ── */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-56"
                    placeholder="Search by name, email..."
                    value={searchId} onChange={(e) => setSearchId(e.target.value)} />
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
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg mb-2">No Job Applicants found</p>
                        <p className="text-sm">Click "+ Add Job Applicant" to create one</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-10">#</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Applicant Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Job Opening</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Designation</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row, i) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                        <td className="px-4 py-3 text-blue-600 cursor-pointer font-medium" onClick={() => handleEdit(row)}>{row.applicant_name || row.name || '-'}</td>
                                        <td className="px-4 py-3">{row.email_id || '-'}</td>
                                        <td className="px-4 py-3">{row.job_title || '-'}</td>
                                        <td className="px-4 py-3">{row.designation || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(row.status)}`}>{row.status || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3 flex text-center">
                                            <button className="text-blue-600 hover:underline text-xs mr-3" onClick={() => handleEdit(row)}>Edit</button>
                                            <button className="text-red-600 hover:underline text-xs" onClick={() => handleDelete(row)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {!loading && (
                <div className="mt-3 text-xs text-gray-400 flex justify-between">
                    <span>Total: {data.length} records</span>
                    <span>Source: ERPNext → /api/resource/Job Applicant</span>
                </div>
            )}
        </div>
    );
}
