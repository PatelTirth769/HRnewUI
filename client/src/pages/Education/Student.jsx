import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';
import * as XLSX from 'xlsx';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const TABS = ['Details', 'Address', 'Relations', 'Customer Details', 'Exit'];
const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['', 'Male', 'Female', 'Other'];

const emptyForm = () => ({
    enabled: 1,
    first_name: '',
    naming_series: 'EDU-STU-.YYYY.-',
    middle_name: '',
    gr_number: '',
    roll_number: '',
    joining_date: new Date().toISOString().slice(0, 10),
    last_name: '',
    program: '',
    user: '',
    student_email_id: '',
    student_mobile_number: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    nationality: '',
    // Address
    address_line_1: '',
    address_line_2: '',
    pincode: '',
    city: '',
    state: '',
    country: 'India',
    // Relations
    guardians: [],
    siblings: [],
    // Customer Details
    customer_group: '',
    // Exit
    date_of_leaving: '',
    reason_for_leaving: '',
    leaving_certificate_number: '',
});

const Student = () => {
    const [api, contextHolder] = notification.useNotification();
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form' or 'import'
    const [editingRecord, setEditingRecord] = useState(null);

    // --- Data Import States ---
    const [importView, setImportView] = useState('list'); // 'list' or 'form'
    const [importList, setImportList] = useState(() => {
        const stored = localStorage.getItem('student_imports');
        return stored ? JSON.parse(stored) : [];
    });
    const [activeImportRun, setActiveImportRun] = useState(null);
    const [importType, setImportType] = useState('Insert New Records');
    const [dontSendEmails, setDontSendEmails] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [importProgress, setImportProgress] = useState(0);
    const [importing, setImporting] = useState(false);
    const [importLogs, setImportLogs] = useState([]);
    const [previewRows, setPreviewRows] = useState([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateFormat, setTemplateFormat] = useState('Excel');
    const [templateType, setTemplateType] = useState('Blank Template');
    const [selectedFields, setSelectedFields] = useState({
        id: true, enabled: false, first_name: true, middle_name: false, gr_number: false, roll_number: false,
        last_name: false, program: false, naming_series: false, joining_date: false, user_id: false,
        student_applicant: false, image: false, student_email_address: true, date_of_birth: false, blood_group: false,
        student_mobile_number: false, gender: false, nationality: false, address_line_1: false, address_line_2: false,
        pincode: false, city: false, state: false, country: false, customer: false, customer_group: false,
        date_of_leaving: false, leaving_certificate_number: false, reason_for_leaving: false, student_name: false,
        guardian_guardian: false, guardian_guardian_name: false, guardian_id: false, guardian_relation: false,
        guardian_email_address: false, guardian_mobile_number: false, guardian_occupation: false, guardian_designation: false,
        guardian_education: false, guardian_alternate_number: false, guardian_date_of_birth: false, guardian_work_address: false,
        sibling_date_of_birth: false, sibling_full_name: false, sibling_gender: false, sibling_id: false,
        sibling_institution: false, sibling_program: false, sibling_student_id: false, sibling_studying_in_same_institute: false
    });


    // List states
    const [students, setStudents] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [pageSize, setPageSize] = useState(20);
    const [visibleCount, setVisibleCount] = useState(20);

    useEffect(() => {
        setVisibleCount(pageSize);
    }, [search, selectedProgram, pageSize]);

    // Form states
    const [activeTab, setActiveTab] = useState('Details');
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dynamic dropdown options from ERPNext
    const [countries, setCountries] = useState([]);
    const [customerGroups, setCustomerGroups] = useState([]);
    const [guardiansList, setGuardiansList] = useState([]);
    const [programs, setPrograms] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchStudents();
            fetchDropdownData(); // For filter dropdown
        } else if (view === 'import') {
            fetchImportList();
            fetchDropdownData();
        } else {
            setActiveTab('Details');
            fetchDropdownData();
            if (editingRecord) {
                fetchStudent(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);


    const fetchStudents = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Student?fields=["name","first_name","middle_name","last_name","student_email_id","student_mobile_number","joining_date","enabled","gender","program","gr_number","roll_number"]&limit_page_length=None&order_by=modified desc';
            const response = await API.get(url);
            setStudents(response.data.data || []);
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [countryRes, custGroupRes, guardianRes, programRes] = await Promise.all([
                API.get('/api/resource/Country?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Customer Group?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Guardian?fields=["name","guardian_name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Program?fields=["name"]&limit_page_length=None&order_by=name asc'),
            ]);
            setCountries((countryRes.data.data || []).map(c => c.name));
            setCustomerGroups((custGroupRes.data.data || []).map(c => c.name));
            setGuardiansList((guardianRes.data.data || []).map(g => ({ name: g.name, guardian_name: g.guardian_name || g.name })));
            setPrograms((programRes.data.data || []).map(p => p.name));
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchStudent = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Student/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                enabled: d.enabled ?? 1,
                first_name: d.first_name || '',
                naming_series: d.naming_series || 'EDU-STU-.YYYY.-',
                middle_name: d.middle_name || '',
                gr_number: d.gr_number || '',
                roll_number: d.roll_number || '',
                joining_date: d.joining_date || '',
                last_name: d.last_name || '',
                user: d.user || '',
                student_email_id: d.student_email_id || '',
                student_mobile_number: d.student_mobile_number || '',
                date_of_birth: d.date_of_birth || '',
                gender: d.gender || '',
                blood_group: d.blood_group || '',
                nationality: d.nationality || '',
                address_line_1: d.address_line_1 || '',
                address_line_2: d.address_line_2 || '',
                pincode: d.pincode || '',
                city: d.city || '',
                state: d.state || '',
                country: d.country || 'India',
                guardians: d.guardians || [],
                siblings: d.siblings || [],
                program: d.program || '',
                customer_group: d.customer_group || '',
                date_of_leaving: d.date_of_leaving || '',
                reason_for_leaving: d.reason_for_leaving || '',
                leaving_certificate_number: d.leaving_certificate_number || '',
            });
        } catch (err) {
            console.error('Error fetching student:', err);
            api.error({ message: 'Error', description: 'Failed to load student data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!form.first_name) {
            api.warning({ message: 'First Name is required.' });
            return;
        }

        // Validate guardians
        for (let i = 0; i < form.guardians.length; i++) {
            const g = form.guardians[i];
            if (g.is_new && !g.guardian_name) {
                api.warning({ message: `Guardian Name is required for Guardian #${i + 1}.` });
                return;
            }
            if (!g.is_new && !g.guardian) {
                api.warning({ message: `Please select an existing guardian for Guardian #${i + 1} or remove it.` });
                return;
            }
            if (!g.relation) {
                api.warning({ message: `Relation is required for Guardian #${i + 1}.` });
                return;
            }
        }

        setSaving(true);
        try {
            // Process guardians
            const finalGuardians = [];
            for (let i = 0; i < form.guardians.length; i++) {
                const g = form.guardians[i];
                const cleanGName = (g.guardian_name || 'guardian').replace(/\s+/g, '').toLowerCase();
                const baseGEmail = g.email_address || g.user;
                const gEmail = baseGEmail ? baseGEmail.trim() : `${cleanGName}.${Date.now().toString().slice(-4)}${i}@guardian.ssvschool.edu.in`;

                let finalGuardianName = g.guardian;
                let finalGuardianDisplayName = g.guardian_name || `Parent of ${form.first_name || 'Student'}`;
                if (g.is_new) {
                    const guardianPayload = {
                        guardian_name: finalGuardianDisplayName,
                        email_address: gEmail,
                        mobile_number: g.mobile_number ? String(g.mobile_number).trim() : null,
                        occupation: g.occupation || null,
                        designation: g.designation || null,
                        education: g.education || null,
                        alternate_number: g.alternate_number ? String(g.alternate_number).trim() : null,
                        date_of_birth: g.date_of_birth || null,
                        work_address: g.work_address || null
                    };

                    let gAttempts = 0;
                    while (gAttempts < 15 && !finalGuardianName) {
                        gAttempts++;
                        try {
                            const gRes = await API.post('/api/resource/Guardian', guardianPayload);
                            const createdGuardian = gRes.data.data;
                            finalGuardianName = createdGuardian.name;
                            finalGuardianDisplayName = createdGuardian.guardian_name;
                            finalGuardians.push({
                                guardian: finalGuardianName,
                                guardian_name: finalGuardianDisplayName,
                                relation: g.relation || 'Others'
                            });
                            console.log(`[ERPNext Guardian Sync] Created Guardian doc on attempt ${gAttempts}:`, finalGuardianName);
                        } catch (gErr) {
                            const status = gErr.response?.status;
                            const errStr = JSON.stringify(gErr.response?.data || {});
                            console.warn(`[ERPNext Guardian Sync] Attempt ${gAttempts} failed:`, gErr.response?.data || gErr.message);
                            
                            if (status === 409 || errStr.includes('DuplicateEntryError') || errStr.includes('Duplicate entry')) {
                                if (gAttempts < 15) {
                                    await new Promise(r => setTimeout(r, 150));
                                    continue;
                                }
                            }
                            
                            // Fallback lookup
                            try {
                                const safeFilters = encodeURIComponent(JSON.stringify([["guardian_name", "like", `%${guardianPayload.guardian_name}%`]]));
                                const sq = await API.get(`/api/resource/Guardian?filters=${safeFilters}&limit_page_length=1`);
                                if (sq.data.data?.length > 0) {
                                    finalGuardianName = sq.data.data[0].name;
                                    finalGuardians.push({
                                        guardian: finalGuardianName,
                                        guardian_name: guardianPayload.guardian_name,
                                        relation: g.relation || 'Others'
                                    });
                                    console.log('[ERPNext Guardian Sync] Fallback resolution: Found and linked existing Guardian doc:', finalGuardianName);
                                    break;
                                }
                            } catch (lookupErr) {
                                console.warn('[ERPNext Guardian Sync] Fallback search also yielded no result.');
                            }
                            break;
                        }
                    }
                } else {
                    finalGuardians.push({
                        guardian: g.guardian,
                        guardian_name: g.guardian_name,
                        relation: g.relation || 'Others'
                    });
                }

                // Sync Guardian User account
                if (finalGuardianDisplayName) {
                    try {
                        const gUserPayload = {
                            mobile_no: g.mobile_number ? String(g.mobile_number).trim() : null,
                            role_profile_name: 'Guardian',
                            module_profile: 'Guardian'
                        };
                        try {
                            await API.put(`/api/resource/User/${encodeURIComponent(gEmail)}`, gUserPayload);
                            console.log('[ERPNext Guardian User Sync] Successfully mapped Guardian profiles to existing User:', gEmail);
                        } catch (guErr) {
                            if (guErr.response?.status === 404) {
                                await API.post('/api/resource/User', {
                                    email: gEmail,
                                    first_name: finalGuardianDisplayName,
                                    send_welcome_email: 1,
                                    ...gUserPayload
                                });
                                console.log('[ERPNext Guardian User Sync] Explicitly auto-created User record for Guardian:', gEmail);
                            } else {
                                console.warn('[ERPNext Guardian User Sync] Non-404 status response:', guErr.message);
                            }
                        }

                        // Map user account back to the Guardian doc
                        if (finalGuardianName) {
                            await API.put(`/api/resource/Guardian/${encodeURIComponent(finalGuardianName)}`, {
                                user: gEmail,
                                email_address: gEmail
                            }).catch(() => {});
                        }
                    } catch (gUserSyncErr) {
                        console.warn('[ERPNext Guardian User Sync] Gracefully caught sync error:', gUserSyncErr.message);
                    }
                }
            }

            // Student payload preparation
            const baseEmail = form.student_email_id;
            const cleanFirstName = (form.first_name || 'student').replace(/\s+/g, '').toLowerCase();
            const safeEmail = baseEmail ? baseEmail.trim() : `${cleanFirstName}.${Date.now().toString().slice(-5)}@ssvschool.edu.in`;

            const payload = { ...form };
            Object.keys(payload).forEach(key => {
                if (payload[key] === '') {
                    payload[key] = null;
                }
            });
            payload.student_email_id = safeEmail;
            payload.guardians = finalGuardians;
            
            // Clean up siblings empty fields
            if (payload.siblings && payload.siblings.length > 0) {
                payload.siblings = payload.siblings.map(s => {
                    const clean = { ...s };
                    Object.keys(clean).forEach(k => { if (clean[k] === '') clean[k] = null; });
                    return clean;
                });
            }

            let erpNextStudentName = null;

            if (editingRecord) {
                await API.put(`/api/resource/Student/${encodeURIComponent(editingRecord)}`, payload);
                erpNextStudentName = editingRecord;
                api.success({ message: 'Student updated successfully.' });

                // Explicitly update Student record with guardians in child table
                if (finalGuardians.length > 0) {
                    await API.put(`/api/resource/Student/${encodeURIComponent(erpNextStudentName)}`, {
                        guardians: finalGuardians
                    }).catch(childErr => console.warn('[ERPNext Guardian Link Sync] Warning during explicit PUT linkage:', childErr.message));
                }
            } else {
                // Implement sequential auto-retry up to 40 times to rapidly push through backend primary key sequence lag (Error 409)
                let attempts = 0;
                const maxAttempts = 40;
                let lastSyncErr = null;

                while (attempts < maxAttempts && !erpNextStudentName) {
                    attempts++;
                    try {
                        const currentPayload = {
                            ...payload,
                            student_email_id: safeEmail
                        };
                        const sRes = await API.post('/api/resource/Student', currentPayload);
                        erpNextStudentName = sRes.data.data.name;
                        api.success({ 
                            message: 'Student created successfully.', 
                            description: `Student Created in ERPNext: ${erpNextStudentName}${attempts > 1 ? ` (auto-recovered sequence lag after ${attempts} attempts)` : ''}` 
                        });

                        // Explicitly update the Student record via PUT to guarantee child table (guardians) linkage parity with Student master storage
                        if (finalGuardians.length > 0) {
                            await API.put(`/api/resource/Student/${encodeURIComponent(erpNextStudentName)}`, {
                                guardians: finalGuardians
                            }).catch(childErr => console.warn('[ERPNext Guardian Link Sync] Warning during explicit PUT linkage:', childErr.message));
                            console.log('[ERPNext Guardian Link Sync] Successfully applied child table guardians linking to Student record.');
                        }
                    } catch (err) {
                        lastSyncErr = err;
                        const status = err.response?.status;
                        const errStr = JSON.stringify(err.response?.data || {});
                        console.warn(`[ERPNext Sync] Attempt ${attempts}/${maxAttempts} failed:`, err.response?.data || err.message);
                        
                        // If it's a primary key/duplicate entry error due to backend tabSeries lag, loop and retry to auto-increment the server sequence
                        if (status === 409 || errStr.includes('DuplicateEntryError') || errStr.includes('Duplicate entry')) {
                            if (attempts < maxAttempts) {
                                await new Promise(r => setTimeout(r, 120));
                                continue;
                            }
                        }
                        break;
                    }
                }

                if (!erpNextStudentName && lastSyncErr) {
                    throw lastSyncErr;
                }
            }

            // Sync/Create Student User account
            if (erpNextStudentName) {
                try {
                    const userPayload = {
                        mobile_no: form.student_mobile_number ? String(form.student_mobile_number).trim() : null,
                        role_profile_name: 'Student',
                        module_profile: 'Student'
                    };
                    try {
                        await API.put(`/api/resource/User/${encodeURIComponent(safeEmail)}`, userPayload);
                        console.log('[ERPNext User Sync] Automatically applied mobile number, role profile, and module profile to User record.');
                    } catch (uErr) {
                        if (uErr.response?.status === 404) {
                            await API.post('/api/resource/User', {
                                email: safeEmail,
                                first_name: form.first_name || 'Student',
                                last_name: form.last_name || null,
                                send_welcome_email: 1,
                                ...userPayload
                            });
                            console.log('[ERPNext User Sync] Explicitly created new User record mapped with Student permissions.');
                        } else {
                            console.warn('[ERPNext User Sync] Non-404 update response:', uErr.message);
                        }
                    }
                } catch (profileSyncErr) {
                    console.warn('[ERPNext User Sync] Gracefully caught sync override error:', profileSyncErr.message);
                }
            }

            setView('list');
        } catch (err) {
            console.error('Save error full details:', err.response?.data);
            let exactError = 'Unknown error occurred';
            
            if (err.response?.data?._server_messages) {
                try {
                    const messages = JSON.parse(err.response.data._server_messages);
                    exactError = JSON.parse(messages[0]).message;
                } catch (e) {
                    exactError = err.response.data._server_messages;
                }
            } else if (err.response?.data?.message) {
                exactError = err.response.data.message;
            } else if (err.response?.data?.exc) {
                exactError = 'Backend Exception: ' + err.response.data.exc;
            } else {
                exactError = err.message;
            }

            api.error({ 
                message: 'Save Failed', 
                description: String(exactError),
                duration: 10
            });
            alert("Error from ERPNext: " + exactError);
            
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            await API.delete(`/api/resource/Student/${encodeURIComponent(editingRecord)}`);
            api.success({ message: 'Student deleted.' });
            setView('list');
        } catch (err) {
            api.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Child table helpers ---
    const addGuardian = () => {
        setForm(prev => ({
            ...prev,
            guardians: [...prev.guardians, { 
                is_new: true,
                guardian: '', 
                guardian_name: '', 
                relation: '',
                email_address: '',
                mobile_number: '',
                occupation: '',
                designation: '',
                education: '',
                alternate_number: '',
                work_address: '',
                date_of_birth: ''
            }]
        }));
    };
    const updateGuardian = (idx, key, val) => {
        setForm(prev => {
            const g = [...prev.guardians];
            g[idx] = { ...g[idx], [key]: val };
            // Auto-fill guardian_name when guardian is selected
            if (key === 'guardian') {
                const found = guardiansList.find(gl => gl.name === val);
                if (found) g[idx].guardian_name = found.guardian_name;
            }
            return { ...prev, guardians: g };
        });
    };
    const removeGuardian = (idx) => {
        setForm(prev => ({ ...prev, guardians: prev.guardians.filter((_, i) => i !== idx) }));
    };

    const addSibling = () => {
        setForm(prev => ({
            ...prev,
            siblings: [...prev.siblings, { full_name: '', gender: '', program: '', date_of_birth: '' }]
        }));
    };
    const updateSibling = (idx, key, val) => {
        setForm(prev => {
            const s = [...prev.siblings];
            s[idx] = { ...s[idx], [key]: val };
            return { ...prev, siblings: s };
        });
    };
    const removeSibling = (idx) => {
        setForm(prev => ({ ...prev, siblings: prev.siblings.filter((_, i) => i !== idx) }));
    };

    // --- Data Import Logics ---
    const CheckboxField = ({ name, label, isRed }) => (
        <label className="flex items-center gap-3 cursor-pointer">
            <input 
                type="checkbox" 
                checked={!!selectedFields[name]} 
                onChange={(e) => setSelectedFields(prev => ({ ...prev, [name]: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black"
            />
            <span className={isRed ? "text-red-600 font-medium" : "text-gray-700 font-medium"}>{label}</span>
        </label>
    );


    const handleDownloadTemplate = async () => {
        const headers = [];
        const cols = [];
        const apiFieldsToFetch = [];

        const orderedFields = [
            'id', 'enabled', 'first_name', 'middle_name', 'gr_number', 'roll_number', 'last_name', 'program', 'naming_series', 'joining_date', 'user_id', 'student_applicant', 'image', 'student_email_address', 'date_of_birth', 'blood_group',
            'student_mobile_number', 'gender', 'nationality', 'address_line_1', 'address_line_2', 'pincode', 'city', 'state', 'country', 'customer', 'customer_group', 'date_of_leaving', 'leaving_certificate_number', 'reason_for_leaving', 'student_name',
            'guardian_guardian', 'guardian_guardian_name', 'guardian_id', 'guardian_relation',
            'guardian_email_address', 'guardian_mobile_number', 'guardian_occupation', 'guardian_designation',
            'guardian_education', 'guardian_alternate_number', 'guardian_date_of_birth', 'guardian_work_address',
            'sibling_date_of_birth', 'sibling_full_name', 'sibling_gender', 'sibling_id', 'sibling_institution', 'sibling_program', 'sibling_student_id', 'sibling_studying_in_same_institute'
        ];

        const fieldMapping = {
            id: { label: 'ID', api: 'name', width: 25 }, enabled: { label: 'Enabled', api: 'enabled', width: 10 },
            first_name: { label: 'First Name', api: 'first_name', width: 20 }, middle_name: { label: 'Middle Name', api: 'middle_name', width: 20 },
            gr_number: { label: 'GR Number', api: 'gr_number', width: 15 }, roll_number: { label: 'Roll Number', api: 'roll_number', width: 15 },
            last_name: { label: 'Last Name', api: 'last_name', width: 20 }, program: { label: 'Program', api: 'program', width: 20 },
            naming_series: { label: 'Naming Series', api: 'naming_series', width: 20 }, joining_date: { label: 'Joining Date', api: 'joining_date', width: 15 },
            user_id: { label: 'User ID', api: 'user_id', width: 20 }, student_applicant: { label: 'Student Applicant', api: 'student_applicant', width: 20 },
            image: { label: 'Image', api: 'image', width: 20 }, student_email_address: { label: 'Student Email Address', api: 'student_email_id', width: 25 },
            date_of_birth: { label: 'Date of Birth', api: 'date_of_birth', width: 15 }, blood_group: { label: 'Blood Group', api: 'blood_group', width: 12 },
            student_mobile_number: { label: 'Student Mobile Number', api: 'student_mobile_number', width: 15 }, gender: { label: 'Gender', api: 'gender', width: 12 },
            nationality: { label: 'Nationality', api: 'nationality', width: 15 }, address_line_1: { label: 'Address Line 1', api: 'address_line_1', width: 25 },
            address_line_2: { label: 'Address Line 2', api: 'address_line_2', width: 25 }, pincode: { label: 'Pincode', api: 'pincode', width: 12 },
            city: { label: 'City', api: 'city', width: 15 }, state: { label: 'State', api: 'state', width: 15 },
            country: { label: 'Country', api: 'country', width: 15 }, customer: { label: 'Customer', api: 'customer', width: 20 },
            customer_group: { label: 'Customer Group', api: 'customer_group', width: 20 }, date_of_leaving: { label: 'Date of Leaving', api: 'date_of_leaving', width: 15 },
            leaving_certificate_number: { label: 'Leaving Certificate Number', api: 'leaving_certificate_number', width: 20 }, reason_for_leaving: { label: 'Reason For Leaving', api: 'reason_for_leaving', width: 20 },
            student_name: { label: 'Student Name', api: 'title', width: 25 },
            guardian_guardian: { label: 'Guardian', api: null, width: 20 }, guardian_guardian_name: { label: 'Guardian Name', api: null, width: 20 },
            guardian_id: { label: 'ID', api: null, width: 20 }, guardian_relation: { label: 'Relation', api: null, width: 15 },
            guardian_email_address: { label: 'Guardian Email Address', api: null, width: 25 },
            guardian_mobile_number: { label: 'Guardian Mobile Number', api: null, width: 15 },
            guardian_occupation: { label: 'Guardian Occupation', api: null, width: 20 },
            guardian_designation: { label: 'Guardian Designation', api: null, width: 20 },
            guardian_education: { label: 'Guardian Education', api: null, width: 20 },
            guardian_alternate_number: { label: 'Guardian Alternate Number', api: null, width: 15 },
            guardian_date_of_birth: { label: 'Guardian Date of Birth', api: null, width: 15 },
            guardian_work_address: { label: 'Guardian Work Address', api: null, width: 25 },
            sibling_date_of_birth: { label: 'Date of Birth', api: null, width: 15 }, sibling_full_name: { label: 'Full Name', api: null, width: 20 },
            sibling_gender: { label: 'Gender', api: null, width: 12 }, sibling_id: { label: 'ID', api: null, width: 20 },
            sibling_institution: { label: 'Institution', api: null, width: 20 }, sibling_program: { label: 'Program', api: null, width: 20 },
            sibling_student_id: { label: 'Student ID', api: null, width: 20 }, sibling_studying_in_same_institute: { label: 'Studying in Same Institute', api: null, width: 15 }
        };

        const activeFields = orderedFields.filter(f => selectedFields[f]);
        
        activeFields.forEach(f => {
            headers.push(fieldMapping[f].label);
            cols.push({ wch: fieldMapping[f].width });
            if (fieldMapping[f].api) {
                apiFieldsToFetch.push(fieldMapping[f].api);
            }
        });

        if (!apiFieldsToFetch.includes('name') && activeFields.length > 0) {
            apiFieldsToFetch.push('name');
        }

        const rows = [headers];

        const getRowData = (rec) => {
            return activeFields.map(f => {
                if (!fieldMapping[f].api) return ""; 
                return rec[fieldMapping[f].api] || "";
            });
        };

        if (templateType === '5 Records' || templateType === 'All Records') {
            api.info({ message: 'Fetching existing student records...', duration: 2 });
            const limit = templateType === '5 Records' ? 5 : 'None';
            try {
                const uniqueApiFields = [...new Set(apiFieldsToFetch)];
                const sRes = await API.get('/api/resource/Student', {
                    params: {
                        fields: JSON.stringify(uniqueApiFields),
                        limit_page_length: limit,
                        order_by: 'modified desc'
                    }
                });
                
                sRes.data.data?.forEach(rec => {
                    rows.push(getRowData(rec));
                });
            } catch (err) {
                console.error('Error exporting existing student records:', err);
                api.error({ message: 'Export Failed', description: 'Failed to retrieve student records.' });
                return;
            }
        } else {
            rows.push(activeFields.map(f => "")); 
        }

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = cols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Student");
        
        const filename = `Student_Import_Template.${templateFormat === 'CSV' ? 'csv' : 'xlsx'}`;
        if (templateFormat === 'CSV') {
            XLSX.writeFile(wb, filename, { bookType: 'csv' });
        } else {
            XLSX.writeFile(wb, filename);
        }
        api.success({ message: `Template ${filename} downloaded successfully.` });
        setShowTemplateModal(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                
                if (jsonData.length === 0) {
                    api.error({ message: 'Error', description: 'The file is empty.' });
                    return;
                }
                
                setPreviewRows(jsonData);
                api.success({ message: 'File parsed successfully.', description: `Found ${jsonData.length} rows.` });
            } catch (err) {
                console.error(err);
                api.error({ message: 'Parsing Failed', description: 'Failed to read spreadsheet file.' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const fetchImportList = async () => {
        try {
            const res = await API.get('/api/resource/Data Import', {
                params: {
                    filters: JSON.stringify([["reference_doctype", "=", "Student"]]),
                    fields: JSON.stringify(["name", "status", "reference_doctype", "import_type", "creation", "import_file"]),
                    limit_page_length: 'None',
                    order_by: 'creation desc'
                }
            });

            const basicList = res.data.data || [];

            const logRes = await API.get('/api/resource/Data Import Log', {
                params: {
                    fields: JSON.stringify(["data_import", "success"]),
                    limit_page_length: 'None'
                }
            });
            const allLogs = logRes.data.data || [];

            const countsMap = {};
            allLogs.forEach(l => {
                if (!l.data_import) return;
                if (!countsMap[l.data_import]) {
                    countsMap[l.data_import] = { success: 0, fail: 0, total: 0 };
                }
                countsMap[l.data_import].total++;
                if (l.success === 1) {
                    countsMap[l.data_import].success++;
                } else {
                    countsMap[l.data_import].fail++;
                }
            });

            const list = basicList.map(d => {
                const counts = countsMap[d.name] || { success: 0, fail: 0, total: 0 };
                return {
                    id: d.name,
                    status: d.status || 'Success',
                    docType: d.reference_doctype,
                    importType: d.import_type,
                    importFile: d.import_file ? d.import_file.split('/').pop() : 'Uploaded File.xlsx',
                    time: new Date(d.creation).toLocaleString(),
                    successCount: counts.success,
                    failureCount: counts.fail,
                    totalRecords: counts.total,
                    logs: []
                };
            });

            setImportList(list);
        } catch (err) {
            console.error('Error fetching Data Import list from ERPNext:', err);
            const stored = localStorage.getItem('student_imports');
            if (stored) setImportList(JSON.parse(stored));
        }
    };

    const handleSelectImportRun = async (row) => {
        if (activeImportRun?.id === row.id) {
            setActiveImportRun(null);
            return;
        }

        if (row.logs && row.logs.length > 0) {
            setActiveImportRun(row);
            return;
        }

        try {
            api.info({ message: 'Fetching import logs...', duration: 1.5 });
            const logRes = await API.get('/api/resource/Data Import Log', {
                params: {
                    filters: JSON.stringify([["data_import", "=", row.id]]),
                    fields: JSON.stringify(["row_indexes", "success", "docname", "messages"]),
                    limit_page_length: 'None',
                    order_by: 'creation asc'
                }
            });

            const fetchedLogs = logRes.data.data?.map(l => {
                let rowNum = "?";
                try {
                    const rowIndexes = JSON.parse(l.row_indexes || "[]");
                    rowNum = rowIndexes[0] || "?";
                } catch (e) {
                    rowNum = l.row_indexes || "?";
                }
                const isSuccess = l.success === 1;
                
                let errMsg = "";
                try {
                    const parsedMessages = JSON.parse(l.messages);
                    errMsg = Array.isArray(parsedMessages) ? parsedMessages.join(", ") : parsedMessages;
                } catch (e) {
                    errMsg = l.messages || "";
                }

                if (typeof errMsg === 'string' && (errMsg.startsWith('[') || errMsg.startsWith('"'))) {
                    try {
                        const parsed = JSON.parse(errMsg);
                        errMsg = Array.isArray(parsed) ? parsed.join(", ") : parsed;
                    } catch (e) {}
                }

                return {
                    type: isSuccess ? 'success' : 'error',
                    msg: isSuccess 
                        ? `Row ${rowNum}: Successfully created/updated record ${l.docname}`
                        : `Row ${rowNum}: Failed - ${errMsg}`
                };
            }) || [];

            const updatedRow = { ...row, logs: fetchedLogs };
            setImportList(prev => prev.map(item => item.id === row.id ? updatedRow : item));
            setActiveImportRun(updatedRow);

            if (fetchedLogs.length === 0) {
                api.warning({ message: 'No detailed logs found for this import run.' });
            }
        } catch (err) {
            console.error('Failed to fetch Data Import logs:', err);
            api.error({ message: 'Failed to fetch logs from server' });
            setActiveImportRun(row);
        }
    };

    const handleDeleteImport = async (id) => {
        if (!window.confirm(`Are you sure you want to delete the Data Import record "${id}"?`)) {
            return;
        }

        try {
            api.info({ message: 'Deleting Data Import record...', duration: 1.5 });
            
            if (!id.startsWith('STU-IMP-')) {
                const logsRes = await API.get('/api/resource/Data Import Log', {
                    params: {
                        filters: JSON.stringify([["data_import", "=", id]]),
                        fields: JSON.stringify(["name"]),
                        limit_page_length: 'None'
                    }
                });
                const logsToDelete = logsRes.data.data || [];
                
                for (let logDoc of logsToDelete) {
                    await API.delete(`/api/resource/Data Import Log/${encodeURIComponent(logDoc.name)}`);
                }
                await API.delete(`/api/resource/Data Import/${encodeURIComponent(id)}`);
            }
            
            const stored = localStorage.getItem('student_imports');
            if (stored) {
                const parsed = JSON.parse(stored);
                const filtered = parsed.filter(item => item.id !== id);
                localStorage.setItem('student_imports', JSON.stringify(filtered));
            }
            
            setImportList(prev => prev.filter(item => item.id !== id));
            if (activeImportRun?.id === id) {
                setActiveImportRun(null);
            }
            api.success({ message: 'Success', description: 'Data Import record deleted successfully.' });
        } catch (err) {
            console.error('Failed to delete Data Import record:', err);
            api.error({ message: 'Delete Failed' });
        }
    };

    const handleStartImport = async () => {
        if (previewRows.length === 0) {
            api.error({ message: 'Error', description: 'No records to import.' });
            return;
        }

        setImporting(true);
        setImportProgress(0);
        const logs = [];
        let successCount = 0;
        let failCount = 0;
        const errorMessages = [];

        try {
            let dataImportName = null;
            try {
                const diRes = await API.post('/api/resource/Data Import', {
                    reference_doctype: "Student",
                    import_type: importType,
                    status: "In Progress",
                    import_file: selectedFile?.name || 'Uploaded File.xlsx',
                    total_records: previewRows.length,
                    success_count: 0,
                    failure_count: 0
                });
                dataImportName = diRes.data.data?.name;
            } catch (err) {
                console.error('Failed to create Data Import record in ERPNext:', err);
            }

            for (let i = 0; i < previewRows.length; i++) {
                const row = previewRows[i];
                const rowNum = i + 2; 
                
                // Support all column names from the template (exact label matches)
                const getField = (row, ...keys) => { for (const k of keys) { if (row[k] !== undefined && row[k] !== '') return row[k]; } return ''; };

                const studentId       = String(getField(row, 'ID', 'id')).trim();
                const firstName       = String(getField(row, 'First Name', 'first_name')).trim();
                const middleName      = String(getField(row, 'Middle Name', 'middle_name')).trim();
                const lastName        = String(getField(row, 'Last Name', 'last_name')).trim();
                const email           = String(getField(row, 'Student Email Address', 'Email', 'student_email_id', 'student_email_address')).trim();
                const mobile          = String(getField(row, 'Student Mobile Number', 'Mobile', 'student_mobile_number')).trim();
                const program         = String(getField(row, 'Program', 'program')).trim();
                const gender          = String(getField(row, 'Gender', 'gender')).trim();
                const grNumber        = String(getField(row, 'GR Number', 'gr_number')).trim();
                const rollNumber      = String(getField(row, 'Roll Number', 'roll_number')).trim();
                const namingSeries    = String(getField(row, 'Naming Series', 'naming_series')).trim();
                const bloodGroup      = String(getField(row, 'Blood Group', 'blood_group')).trim();
                const nationality     = String(getField(row, 'Nationality', 'nationality')).trim();
                const addressLine1    = String(getField(row, 'Address Line 1', 'address_line_1')).trim();
                const addressLine2    = String(getField(row, 'Address Line 2', 'address_line_2')).trim();
                const pincode         = String(getField(row, 'Pincode', 'pincode')).trim();
                const city            = String(getField(row, 'City', 'city')).trim();
                const state           = String(getField(row, 'State', 'state')).trim();
                const country         = String(getField(row, 'Country', 'country')).trim();
                const dateOfLeaving   = String(getField(row, 'Date of Leaving', 'date_of_leaving')).trim();
                const reasonForLeaving= String(getField(row, 'Reason For Leaving', 'reason_for_leaving')).trim();
                let rawDob            = getField(row, 'Date of Birth', 'date_of_birth');
                let rawJoining        = getField(row, 'Joining Date', 'joining_date');

                // Extract guardian detail columns
                const guardianID          = String(getField(row, 'Guardian', 'guardian_id', 'guardian_guardian')).trim();
                const guardianName        = String(getField(row, 'Guardian Name', 'guardian_guardian_name')).trim();
                const guardianRelation    = String(getField(row, 'Relation', 'guardian_relation')).trim();
                const guardianEmail       = String(getField(row, 'Guardian Email Address', 'guardian_email_address')).trim();
                const guardianMobile      = String(getField(row, 'Guardian Mobile Number', 'guardian_mobile_number')).trim();
                const guardianOccupation  = String(getField(row, 'Guardian Occupation', 'guardian_occupation')).trim();
                const guardianDesignation = String(getField(row, 'Guardian Designation', 'guardian_designation')).trim();
                const guardianEducation   = String(getField(row, 'Guardian Education', 'guardian_education')).trim();
                const guardianAlternate   = String(getField(row, 'Guardian Alternate Number', 'guardian_alternate_number')).trim();
                const guardianDobVal      = String(getField(row, 'Guardian Date of Birth', 'guardian_date_of_birth')).trim();
                const guardianWorkAddr    = String(getField(row, 'Guardian Work Address', 'guardian_work_address')).trim();

                try {
                    if (importType === 'Insert New Records' && !firstName) {
                        throw new Error("Missing 'First Name'");
                    }

                    const parseDate = (d) => {
                        if (!d) return '';
                        if (typeof d === 'number') {
                            return new Date(Math.round((d - 25569) * 86400 * 1000)).toISOString().split('T')[0];
                        }
                        if (typeof d === 'string' && d.includes('-')) {
                            const parts = d.split('-');
                            if (parts[0].length === 2 && parts[2].length === 4) {
                                return `${parts[2]}-${parts[1]}-${parts[0]}`;
                            }
                        }
                        return d;
                    };

                    const dob = parseDate(rawDob);
                    const joining = parseDate(rawJoining);

                    // --- Strict dropdown validation (fails import if invalid) ---

                    // 1. Guardian Relation
                    const hasGuardianDetails = !!(guardianID || guardianName || guardianEmail || guardianMobile || guardianOccupation || guardianDesignation || guardianEducation || guardianAlternate || guardianDobVal || guardianWorkAddr);
                    if (hasGuardianDetails) {
                        if (!guardianRelation) {
                            throw new Error("Relation with Student is required when specifying Guardian details.");
                        }
                        if (!guardianID && !guardianName) {
                            throw new Error("Guardian Name or existing Guardian ID is required when specifying Guardian details.");
                        }
                    }

                    if (guardianRelation) {
                        const validRelations = ['Father', 'Mother', 'Others'];
                        const trimmedRelation = guardianRelation.trim();
                        const match = validRelations.find(r => r.toLowerCase() === trimmedRelation.toLowerCase());
                        if (!match) {
                            throw new Error(`Invalid Relation: ${guardianRelation}. Allowed options are Father, Mother, Others.`);
                        }
                    }

                    // 2. Gender
                    let resolvedGender = gender || undefined;
                    if (gender) {
                        const validGenders = ['Male', 'Female', 'Other'];
                        const trimmedGender = gender.trim();
                        const match = validGenders.find(g => g.toLowerCase() === trimmedGender.toLowerCase());
                        if (!match) {
                            throw new Error(`Invalid Gender: ${gender}. Allowed options are Male, Female, Other.`);
                        }
                        resolvedGender = match;
                    }

                    // 3. Blood Group
                    let resolvedBloodGroup = bloodGroup || undefined;
                    if (bloodGroup) {
                        const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
                        const trimmedBG = bloodGroup.trim().replace(/\s+/g, '');
                        const match = validBloodGroups.find(bg => bg.toLowerCase() === trimmedBG.toLowerCase());
                        if (!match) {
                            throw new Error(`Invalid Blood Group: ${bloodGroup}. Allowed options are A+, A-, B+, B-, O+, O-, AB+, AB-.`);
                        }
                        resolvedBloodGroup = match;
                    }

                    // --- Dynamic Reference resolution & auto-creation (creates dynamic document if missing) ---

                    // 1. Program
                    let resolvedProgram = program || undefined;
                    if (program) {
                        const trimmedProgram = program.trim();
                        const match = programs.find(p => p.toLowerCase() === trimmedProgram.toLowerCase());
                        if (!match) {
                            const programAbbr = trimmedProgram.split(' ').map(w => w[0]).join('').toUpperCase() || trimmedProgram;
                            const newProgramRes = await API.post('/api/resource/Program', {
                                program_name: trimmedProgram,
                                program_abbreviation: programAbbr
                            });
                            const createdProgramName = newProgramRes.data.data?.name || trimmedProgram;
                            setPrograms(prev => [...prev, createdProgramName]);
                            resolvedProgram = createdProgramName;
                        } else {
                            resolvedProgram = match;
                        }
                    }

                    // 2. Country
                    let resolvedCountry = country || undefined;
                    if (country) {
                        const trimmedCountry = country.trim();
                        const match = countries.find(c => c.toLowerCase() === trimmedCountry.toLowerCase());
                        if (!match) {
                            const newCountryRes = await API.post('/api/resource/Country', {
                                country_name: trimmedCountry
                            });
                            const createdCountryName = newCountryRes.data.data?.name || trimmedCountry;
                            setCountries(prev => [...prev, createdCountryName]);
                            resolvedCountry = createdCountryName;
                        } else {
                            resolvedCountry = match;
                        }
                    }

                    // 3. Customer Group
                    const customerGroup = getField(row, 'Customer Group', 'customer_group');
                    let resolvedCustomerGroup = customerGroup || undefined;
                    if (customerGroup) {
                        const trimmedCG = customerGroup.trim();
                        const match = customerGroups.find(cg => cg.toLowerCase() === trimmedCG.toLowerCase());
                        if (!match) {
                            const newCGRes = await API.post('/api/resource/Customer Group', {
                                customer_group_name: trimmedCG
                            });
                            const createdCGName = newCGRes.data.data?.name || trimmedCG;
                            setCustomerGroups(prev => [...prev, createdCGName]);
                            resolvedCustomerGroup = createdCGName;
                        } else {
                            resolvedCustomerGroup = match;
                        }
                    }

                    // --- Dynamic Guardian linkage & auto-creation if columns are present ---
                    let finalGuardians = [];
                    if (hasGuardianDetails) {
                        const trimmedRelation = guardianRelation.trim();
                        const matchRelation = ['Father', 'Mother', 'Others'].find(r => r.toLowerCase() === trimmedRelation.toLowerCase()) || 'Others';

                        let resolvedGuardianId = guardianID || undefined;
                        let finalGuardianDisplayName = guardianName ? guardianName.trim() : `Parent of ${firstName || 'Student'}`;
                        const cleanGName = finalGuardianDisplayName.replace(/\s+/g, '').toLowerCase();
                        const gEmail = guardianEmail ? guardianEmail.trim() : `${cleanGName}.${Date.now().toString().slice(-4)}@guardian.ssvschool.edu.in`;

                        if (!resolvedGuardianId && guardianName) {
                            const found = guardiansList.find(g => g.guardian_name?.toLowerCase() === guardianName.trim().toLowerCase());
                            if (found) {
                                resolvedGuardianId = found.name;
                            } else {
                                const guardianPayload = {
                                    guardian_name: guardianName.trim(),
                                    email_address: gEmail,
                                    mobile_number: guardianMobile || null,
                                    occupation: guardianOccupation || null,
                                    designation: guardianDesignation || null,
                                    education: guardianEducation || null,
                                    alternate_number: guardianAlternate || null,
                                    work_address: guardianWorkAddr || null,
                                    date_of_birth: parseDate(guardianDobVal) || null
                                };

                                let gAttempts = 0;
                                while (gAttempts < 15 && !resolvedGuardianId) {
                                    gAttempts++;
                                    try {
                                        const gRes = await API.post('/api/resource/Guardian', guardianPayload);
                                        const createdGuardian = gRes.data.data;
                                        resolvedGuardianId = createdGuardian.name;
                                        finalGuardianDisplayName = createdGuardian.guardian_name;
                                        console.log(`[ERPNext Guardian Sync] Created Guardian doc on attempt ${gAttempts}:`, resolvedGuardianId);
                                    } catch (gErr) {
                                        const status = gErr.response?.status;
                                        const errStr = JSON.stringify(gErr.response?.data || {});
                                        console.warn(`[ERPNext Guardian Sync] Attempt ${gAttempts} failed:`, gErr.response?.data || gErr.message);

                                        if (status === 409 || errStr.includes('DuplicateEntryError') || errStr.includes('Duplicate entry')) {
                                            if (gAttempts < 15) {
                                                await new Promise(r => setTimeout(r, 150));
                                                continue;
                                            }
                                        }

                                        // Fallback lookup
                                        try {
                                            const safeFilters = encodeURIComponent(JSON.stringify([["guardian_name", "like", `%${guardianPayload.guardian_name}%`]]));
                                            const sq = await API.get(`/api/resource/Guardian?filters=${safeFilters}&limit_page_length=1`);
                                            if (sq.data.data?.length > 0) {
                                                resolvedGuardianId = sq.data.data[0].name;
                                                console.log('[ERPNext Guardian Sync] Fallback resolution: Found existing Guardian doc:', resolvedGuardianId);
                                                break;
                                            }
                                        } catch (lookupErr) {
                                            console.warn('[ERPNext Guardian Sync] Fallback search yielded no result.');
                                        }
                                        throw gErr;
                                    }
                                }
                            }
                        }

                        // Sync Guardian User account
                        if (finalGuardianDisplayName) {
                            const gUserPayload = {
                                mobile_no: guardianMobile || null,
                                role_profile_name: 'Guardian',
                                module_profile: 'Guardian'
                            };
                            try {
                                await API.put(`/api/resource/User/${encodeURIComponent(gEmail)}`, gUserPayload);
                                console.log('[ERPNext Guardian User Sync] Successfully mapped Guardian profiles to existing User:', gEmail);
                            } catch (guErr) {
                                if (guErr.response?.status === 404) {
                                    await API.post('/api/resource/User', {
                                        email: gEmail,
                                        first_name: finalGuardianDisplayName,
                                        send_welcome_email: 1,
                                        ...gUserPayload
                                    });
                                    console.log('[ERPNext Guardian User Sync] Explicitly auto-created User record for Guardian:', gEmail);
                                } else {
                                    throw guErr;
                                }
                            }

                            // Map user account back to the Guardian doc
                            if (resolvedGuardianId) {
                                await API.put(`/api/resource/Guardian/${encodeURIComponent(resolvedGuardianId)}`, {
                                    user: gEmail,
                                    email_address: gEmail
                                });
                            }
                        }

                        if (resolvedGuardianId) {
                            finalGuardians.push({
                                guardian: resolvedGuardianId,
                                guardian_name: finalGuardianDisplayName,
                                relation: matchRelation
                            });
                        }
                    }

                    // Student email resolution
                    const cleanFirstName = (firstName || 'student').replace(/\s+/g, '').toLowerCase();
                    const safeEmail = email ? email.trim() : `${cleanFirstName}.${Date.now().toString().slice(-5)}@ssvschool.edu.in`;

                    const payload = {
                        first_name: firstName || undefined,
                        middle_name: middleName || undefined,
                        last_name: lastName || undefined,
                        student_email_id: safeEmail,
                        student_mobile_number: mobile || undefined,
                        program: resolvedProgram,
                        gender: resolvedGender,
                        gr_number: grNumber || undefined,
                        roll_number: rollNumber || undefined,
                        naming_series: namingSeries || undefined,
                        blood_group: resolvedBloodGroup,
                        nationality: nationality || undefined,
                        address_line_1: addressLine1 || undefined,
                        address_line_2: addressLine2 || undefined,
                        pincode: pincode || undefined,
                        city: city || undefined,
                        state: state || undefined,
                        country: resolvedCountry,
                        customer_group: resolvedCustomerGroup,
                        date_of_leaving: dateOfLeaving || undefined,
                        reason_for_leaving: reasonForLeaving || undefined,
                        date_of_birth: dob || undefined,
                        joining_date: joining || undefined,
                    };
                    
                    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

                    let erpNextStudentName = studentId || null;

                    if (importType === 'Update Existing Records') {
                        if (!erpNextStudentName) throw new Error("Missing 'ID' for update");
                        await API.put(`/api/resource/Student/${encodeURIComponent(erpNextStudentName)}`, payload);
                        if (finalGuardians.length > 0) {
                            await API.put(`/api/resource/Student/${encodeURIComponent(erpNextStudentName)}`, {
                                guardians: finalGuardians
                            });
                        }
                        successCount++;
                        logs.push({ type: 'success', msg: `Row ${rowNum}: Successfully updated Student ID ${erpNextStudentName}` });
                    } else {
                        // Insert New Records
                        let attempts = 0;
                        const maxAttempts = 40;
                        let lastSyncErr = null;

                        while (attempts < maxAttempts && !erpNextStudentName) {
                            attempts++;
                            try {
                                const currentPayload = {
                                    ...payload,
                                    student_email_id: safeEmail
                                };
                                const sRes = await API.post('/api/resource/Student', currentPayload);
                                erpNextStudentName = sRes.data.data.name;
                                
                                // Explicitly update the Student record via PUT to guarantee child table (guardians) linkage parity with Student master storage
                                if (finalGuardians.length > 0) {
                                    await API.put(`/api/resource/Student/${encodeURIComponent(erpNextStudentName)}`, {
                                        guardians: finalGuardians
                                    });
                                }
                            } catch (err) {
                                lastSyncErr = err;
                                const status = err.response?.status;
                                const errStr = JSON.stringify(err.response?.data || {});
                                console.warn(`[ERPNext Sync] Attempt ${attempts}/${maxAttempts} failed:`, err.response?.data || err.message);
                                
                                // If it's a primary key/duplicate entry error due to backend tabSeries lag, loop and retry to auto-increment the server sequence
                                if (status === 409 || errStr.includes('DuplicateEntryError') || errStr.includes('Duplicate entry')) {
                                    if (attempts < maxAttempts) {
                                        await new Promise(r => setTimeout(r, 120));
                                        continue;
                                    }
                                }
                                throw err;
                            }
                        }

                        if (!erpNextStudentName && lastSyncErr) {
                            throw lastSyncErr;
                        }

                        successCount++;
                        logs.push({ type: 'success', msg: `Row ${rowNum}: Successfully created record ${erpNextStudentName}` });
                    }

                    // Sync/Create Student User account
                    if (erpNextStudentName) {
                        const userPayload = {
                            mobile_no: mobile || null,
                            role_profile_name: 'Student',
                            module_profile: 'Student'
                        };
                        try {
                            await API.put(`/api/resource/User/${encodeURIComponent(safeEmail)}`, userPayload);
                            console.log('[ERPNext User Sync] Automatically applied mobile number, role profile, and module profile to User record.');
                        } catch (uErr) {
                            if (uErr.response?.status === 404) {
                                await API.post('/api/resource/User', {
                                    email: safeEmail,
                                    first_name: firstName || 'Student',
                                    last_name: lastName || null,
                                    send_welcome_email: 1,
                                    ...userPayload
                                });
                                console.log('[ERPNext User Sync] Explicitly created new User record mapped with Student permissions.');
                            } else {
                                throw uErr;
                            }
                        }
                    }
                } catch (err) {
                    failCount++;
                    let errMsg = '';
                    try {
                        if (err.response?.data?._server_messages) {
                            const parsed = JSON.parse(err.response.data._server_messages);
                            const firstMsg = typeof parsed === 'string' ? JSON.parse(parsed) : parsed[0];
                            errMsg = typeof firstMsg === 'string' ? JSON.parse(firstMsg).message : (firstMsg?.message || JSON.stringify(firstMsg));
                        } else {
                            errMsg = err.response?.data?.message || err.message;
                        }
                    } catch (jsonErr) {
                        errMsg = err.response?.data?.message || err.message;
                    }
                    logs.push({ type: 'error', msg: `Row ${rowNum}: Failed - ${errMsg}` });
                    errorMessages.push(`Row ${rowNum}: ${errMsg}`);
                }

                setImportProgress(Math.round(((i + 1) / previewRows.length) * 100));
                setImportLogs([...logs]);
            }

            const finalStatus = failCount === 0 
                ? "Success" 
                : failCount === previewRows.length 
                    ? "Failed" 
                    : "Partial Success";

            if (dataImportName) {
                try {
                    await API.put(`/api/resource/Data Import/${encodeURIComponent(dataImportName)}`, {
                        status: finalStatus,
                        success_count: successCount,
                        failure_count: failCount
                    });
                } catch (err) {
                    console.error('Failed to update Data Import status in ERPNext:', err);
                }
            }

            const newRun = {
                id: dataImportName || `STU-IMP-${Date.now().toString().slice(-5)}`,
                status: finalStatus,
                docType: "Student",
                importType: importType,
                importFile: selectedFile?.name || 'Uploaded File.xlsx',
                time: new Date().toLocaleString(),
                successCount: successCount,
                failureCount: failCount,
                totalRecords: previewRows.length,
                logs: logs
            };
            const updatedList = [newRun, ...(Array.isArray(importList) ? importList : []).filter(item => item && item.id !== dataImportName)];
            localStorage.setItem('student_imports', JSON.stringify(updatedList));

            // Save log to Firebase Firestore
            try {
                const firebaseLogPayload = {
                    id: newRun.id,
                    fileName: newRun.importFile,
                    importType: newRun.importType,
                    timestamp: serverTimestamp(),
                    successCount: newRun.successCount,
                    failureCount: newRun.failureCount,
                    totalRecords: newRun.totalRecords,
                    status: newRun.status,
                    logs: newRun.logs.map(l => ({ type: l.type, msg: l.msg })),
                    module: 'Student'
                };
                await addDoc(collection(db, "schooler_system", "student_imports", "logs"), firebaseLogPayload);
            } catch (fsErr) {
                console.error('Failed to save import log to Firestore:', fsErr);
            }

            if (successCount > 0 && failCount === 0) {
                api.success({
                    message: 'Import Successful',
                    description: `Student import successfully completed. Affected rows: ${successCount}.`,
                    duration: 6
                });
            } else if (successCount > 0 && failCount > 0) {
                api.success({
                    message: 'Import Completed',
                    description: `Student import completed with ${successCount} row(s) successfully processed.`,
                    duration: 6
                });
                const uniqueErrors = [...new Set(errorMessages)];
                api.warning({
                    message: 'Import Partial Success',
                    description: `Failed to import ${failCount} record(s). Reasons:\n${uniqueErrors.slice(0, 5).join('\n')}${uniqueErrors.length > 5 ? '\n...and more.' : ''}`,
                    duration: 10
                });
            } else if (successCount === 0 && failCount > 0) {
                const uniqueErrors = [...new Set(errorMessages)];
                api.error({
                    message: 'Import Failed',
                    description: `Student import failed. Reasons:\n${uniqueErrors.slice(0, 5).join('\n')}${uniqueErrors.length > 5 ? '\n...and more.' : ''}`,
                    duration: 10
                });
            } else {
                api.info({
                    message: 'Import Run Empty',
                    description: 'No student records were processed.',
                    duration: 6
                });
            }
        } catch (outerErr) {
            console.error('Critical failure in handleStartImport:', outerErr);
            api.error({
                message: 'Import Error',
                description: `A critical error occurred: ${outerErr.message}`,
                duration: 10
            });
        } finally {
            setImporting(false);
            setImportView('list');
            fetchImportList();
        }
    };

    // --- Styles (Standard App UI) ---

    if (view === 'import') {
        return (
            <div className="p-6">
                {contextHolder}
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tools</div>
                        <h1 className="text-2xl font-bold text-gray-800">Data Import</h1>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition font-medium"
                            onClick={() => setView('list')}
                            disabled={importing}
                        >
                            ← Back to Students
                        </button>
                        {importView === 'list' && (
                            <button 
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium flex items-center gap-1.5 shadow-sm"
                                onClick={() => {
                                    setImportView('form');
                                    setImportType('Insert New Records');
                                    setPreviewRows([]);
                                    setSelectedFile(null);
                                    setImportLogs([]);
                                    setImportProgress(0);
                                }}
                            >
                                + Add Data Import
                            </button>
                        )}
                    </div>
                </div>

                {importView === 'list' ? (
                    <>
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600">Document Type</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600">Import Type</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600 text-center">Success</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600 text-center">Failed</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600 text-center">Total</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600">Import File</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600">Time</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importList.map((row) => (
                                        <tr 
                                            key={row.id} 
                                            className="border-b hover:bg-gray-50 transition cursor-pointer font-medium"
                                            onClick={() => handleSelectImportRun(row)}
                                        >
                                            <td className="px-4 py-3 font-semibold text-blue-600 hover:underline">{row.id}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                                                    row.status === 'Success' 
                                                        ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' 
                                                        : row.status === 'Failed' 
                                                            ? 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]' 
                                                            : 'bg-[#FEF08A] text-[#854D0E] border-[#FEF08A]'
                                                }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{row.docType}</td>
                                            <td className="px-4 py-3 text-gray-600">{row.importType}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold">
                                                    {row.successCount ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-bold">
                                                    {row.failureCount ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-0.5 bg-gray-50 text-gray-700 border border-gray-200 rounded text-xs font-bold">
                                                    {row.totalRecords ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 italic max-w-xs truncate">{row.importFile}</td>
                                            <td className="px-4 py-3 text-gray-500">{row.time}</td>
                                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleDeleteImport(row.id)}
                                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                                                    title="Delete Import Record"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
 
                        {activeImportRun && (
                            <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-fadeIn">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-800 text-base">Import Logs for {activeImportRun.id}</h3>
                                    <button 
                                        className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
                                        onClick={() => setActiveImportRun(null)}
                                    >
                                        ✕ Close Logs
                                    </button>
                                </div>
                                <div className="max-h-60 overflow-y-auto border border-gray-150 rounded bg-gray-50 p-3 font-mono text-xs space-y-1">
                                    {activeImportRun.logs?.map((log, idx) => (
                                        <div 
                                            key={idx} 
                                            className={log.type === 'error' ? 'text-red-600' : 'text-green-600'}
                                            dangerouslySetInnerHTML={{ __html: log.msg }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-6">
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <h2 className="font-bold text-gray-800 text-base">Document Import Settings</h2>
                                    {previewRows.length > 0 && (
                                        <button 
                                            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 shadow-sm transition"
                                            onClick={handleStartImport}
                                            disabled={importing}
                                        >
                                            {importing ? 'Importing...' : 'Start Import Run'}
                                        </button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Document Type</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500 font-semibold cursor-not-allowed" 
                                            value="Student" 
                                            disabled 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Import Type *</label>
                                        <select 
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 font-semibold" 
                                            value={importType} 
                                            onChange={(e) => setImportType(e.target.value)}
                                            disabled={importing}
                                        >
                                            <option value="Insert New Records">Insert New Records</option>
                                            <option value="Update Existing Records">Update Existing Records</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        className="px-4 py-2 bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 rounded text-sm font-semibold transition"
                                        onClick={() => setShowTemplateModal(true)}
                                        disabled={importing}
                                    >
                                        Download Template
                                    </button>
                                    <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm font-semibold text-gray-700 cursor-pointer transition flex items-center gap-1">
                                        Attach File
                                        <input 
                                            type="file" 
                                            accept=".xlsx,.xls,.csv" 
                                            className="hidden" 
                                            onChange={handleFileChange}
                                            disabled={importing}
                                        />
                                    </label>
                                    {selectedFile && (
                                        <div className="flex items-center text-xs text-gray-500 font-semibold bg-gray-100 rounded px-3 border border-gray-200">
                                            📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                        </div>
                                    )}
                                </div>
                            </div>

                            {previewRows.length > 0 && (() => {
                                const previewCols = Object.keys(previewRows[0] || {});
                                return (
                                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-scaleUp">
                                    <h2 className="font-bold text-gray-800 text-base border-b pb-2 mb-3">Data Preview ({previewRows.length} Rows)</h2>
                                    <div className="max-h-80 overflow-auto border border-gray-200 rounded-lg">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 border-b sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 font-bold text-gray-600 whitespace-nowrap">Sr. No</th>
                                                    {previewCols.map(col => (
                                                        <th key={col} className="px-3 py-2 font-bold text-gray-600 whitespace-nowrap">{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewRows.slice(0, 10).map((row, idx) => (
                                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                                        <td className="px-3 py-2 font-semibold text-gray-400">{idx + 1}</td>
                                                        {previewCols.map(col => (
                                                            <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap">{row[col] !== undefined && row[col] !== '' ? String(row[col]) : '-'}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {previewRows.length > 10 && (
                                        <div className="text-center text-xs text-gray-400 mt-2 font-semibold">
                                            Showing first 10 of {previewRows.length} rows. All rows will be imported.
                                        </div>
                                    )}
                                </div>
                                );
                            })()}
                        </div>

                        <div className="space-y-6">
                            {(importing || importLogs.length > 0) && (
                                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                                    <h2 className="font-bold text-gray-800 text-base border-b pb-2">Import Progress</h2>
                                    
                                    {importing && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-gray-600">
                                                <span>Processing Rows...</span>
                                                <span>{importProgress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="max-h-60 overflow-y-auto border border-gray-150 rounded bg-gray-50 p-3 font-mono text-[11px] space-y-1">
                                        {importLogs.map((log, idx) => (
                                            <div 
                                                key={idx} 
                                                className={log.type === 'error' ? 'text-red-600' : 'text-green-600'}
                                                dangerouslySetInnerHTML={{ __html: log.msg }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showTemplateModal && (
                    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 animate-fadeIn">
                        <div className="bg-white rounded-xl shadow-xl w-[700px] max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 transform scale-100 transition-all duration-300">
                            <div className="flex justify-between items-center p-4 border-b shrink-0">
                                <h3 className="font-bold text-gray-800 text-lg">Export Data</h3>
                                <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
                            </div>
                            <div className="p-6 space-y-6 overflow-y-auto grow custom-scrollbar">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-2">File Type</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-500 font-medium text-gray-700"
                                        value={templateFormat}
                                        onChange={(e) => setTemplateFormat(e.target.value)}
                                    >
                                        <option value="CSV">CSV</option>
                                        <option value="Excel">Excel</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-500 mb-2">Export Type</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-500 font-medium text-gray-700"
                                        value={templateType}
                                        onChange={(e) => setTemplateType(e.target.value)}
                                    >
                                        <option value="Blank Template">Blank Template</option>
                                        <option value="5 Records">5 Records</option>
                                        <option value="All Records">All Records</option>
                                    </select>
                                    {templateType !== 'Blank Template' && (
                                        <p className="text-xs text-gray-500 mt-1">{templateType === '5 Records' ? '5 records will be exported' : 'All records will be exported'}</p>
                                    )}
                                </div>

                                <div className="border-t pt-4">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">SELECT FIELDS TO INSERT</label>
                                    
                                    <div className="flex gap-2 mb-6">
                                        <button 
                                            type="button" 
                                            className="px-3 py-1.5 text-[13px] bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-full font-medium text-gray-700 transition"
                                            onClick={() => {
                                                const allTrue = {};
                                                Object.keys(selectedFields).forEach(k => allTrue[k] = true);
                                                setSelectedFields(allTrue);
                                            }}
                                        >
                                            Select All
                                        </button>
                                        <button 
                                            type="button" 
                                            className="px-3 py-1.5 text-[13px] bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-full font-medium text-gray-700 transition"
                                            onClick={() => {
                                                const allFalse = {};
                                                Object.keys(selectedFields).forEach(k => allFalse[k] = false);
                                                allFalse.id = true;
                                                allFalse.first_name = true;
                                                allFalse.student_email_address = true;
                                                allFalse.guardian_guardian = true;
                                                allFalse.guardian_guardian_name = true;
                                                allFalse.guardian_id = true;
                                                allFalse.sibling_id = true;
                                                setSelectedFields(allFalse);
                                            }}
                                        >
                                            Select Mandatory
                                        </button>
                                        <button 
                                            type="button" 
                                            className="px-3 py-1.5 text-[13px] bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-full font-medium text-gray-700 transition"
                                            onClick={() => {
                                                const allFalse = {};
                                                Object.keys(selectedFields).forEach(k => allFalse[k] = false);
                                                setSelectedFields(allFalse);
                                            }}
                                        >
                                            Unselect All
                                        </button>
                                    </div>

                                    {/* Student Section */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">Student</h4>
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm font-normal text-gray-800">
                                            {/* Column 1 items */}
                                            <div className="flex flex-col gap-3">
                                                <CheckboxField name="id" label="ID" isRed />
                                                <CheckboxField name="enabled" label="Enabled" />
                                                <CheckboxField name="first_name" label="First Name" isRed />
                                                <CheckboxField name="middle_name" label="Middle Name" />
                                                <CheckboxField name="gr_number" label="GR Number" />
                                                <CheckboxField name="roll_number" label="Roll Number" />
                                                <CheckboxField name="last_name" label="Last Name" />
                                                <CheckboxField name="program" label="Program" />
                                                <CheckboxField name="naming_series" label="Naming Series" />
                                                <CheckboxField name="joining_date" label="Joining Date" />
                                                <CheckboxField name="user_id" label="User ID" />
                                                <CheckboxField name="student_applicant" label="Student Applicant" />
                                                <CheckboxField name="image" label="Image" />
                                                <CheckboxField name="student_email_address" label="Student Email Address" isRed />
                                                <CheckboxField name="date_of_birth" label="Date of Birth" />
                                                <CheckboxField name="blood_group" label="Blood Group" />
                                            </div>
                                            {/* Column 2 items */}
                                            <div className="flex flex-col gap-3">
                                                <CheckboxField name="student_mobile_number" label="Student Mobile Number" />
                                                <CheckboxField name="gender" label="Gender" />
                                                <CheckboxField name="nationality" label="Nationality" />
                                                <CheckboxField name="address_line_1" label="Address Line 1" />
                                                <CheckboxField name="address_line_2" label="Address Line 2" />
                                                <CheckboxField name="pincode" label="Pincode" />
                                                <CheckboxField name="city" label="City" />
                                                <CheckboxField name="state" label="State" />
                                                <CheckboxField name="country" label="Country" />
                                                <CheckboxField name="customer" label="Customer" />
                                                <CheckboxField name="customer_group" label="Customer Group" />
                                                <CheckboxField name="date_of_leaving" label="Date of Leaving" />
                                                <CheckboxField name="leaving_certificate_number" label="Leaving Certificate Number" />
                                                <CheckboxField name="reason_for_leaving" label="Reason For Leaving" />
                                                <CheckboxField name="student_name" label="Student Name" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Guardians Section */}
                                    <div className="mb-4 mt-6">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">Guardians (Student Guardian)</h4>
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm font-normal text-gray-800">
                                            <div className="flex flex-col gap-3">
                                                <CheckboxField name="guardian_guardian" label="Guardian" isRed />
                                                <CheckboxField name="guardian_guardian_name" label="Guardian Name" isRed />
                                                <CheckboxField name="guardian_email_address" label="Guardian Email Address" />
                                                <CheckboxField name="guardian_mobile_number" label="Guardian Mobile Number" />
                                                <CheckboxField name="guardian_occupation" label="Guardian Occupation" />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <CheckboxField name="guardian_id" label="ID" isRed />
                                                <CheckboxField name="guardian_relation" label="Relation" />
                                                <CheckboxField name="guardian_designation" label="Guardian Designation" />
                                                <CheckboxField name="guardian_education" label="Guardian Education" />
                                                <CheckboxField name="guardian_alternate_number" label="Guardian Alternate Number" />
                                                <CheckboxField name="guardian_date_of_birth" label="Guardian Date of Birth" />
                                                <CheckboxField name="guardian_work_address" label="Guardian Work Address" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Siblings Section */}
                                    <div className="mb-4 mt-6">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">Siblings (Student Sibling)</h4>
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm font-normal text-gray-800">
                                            <div className="flex flex-col gap-3">
                                                <CheckboxField name="sibling_date_of_birth" label="Date of Birth" />
                                                <CheckboxField name="sibling_full_name" label="Full Name" />
                                                <CheckboxField name="sibling_gender" label="Gender" />
                                                <CheckboxField name="sibling_id" label="ID" isRed />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <CheckboxField name="sibling_institution" label="Institution" />
                                                <CheckboxField name="sibling_program" label="Program" />
                                                <CheckboxField name="sibling_student_id" label="Student ID" />
                                                <CheckboxField name="sibling_studying_in_same_institute" label="Studying in Same Institute" />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                            <div className="bg-white px-6 py-4 border-t shrink-0 flex justify-end">
                                <button onClick={handleDownloadTemplate} className="px-5 py-2.5 text-[13px] font-medium bg-[#1c2126] text-white hover:bg-black rounded-lg shadow-sm transition">
                                    Export {templateType === '5 Records' ? '5 records' : templateType === 'All Records' ? 'all records' : 'template'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }


    // --- Styles (Standard App UI) ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 uppercase tracking-wider";

    if (view === 'list') {
        const filtered = students.filter(s => {
            const matchesSearch = !search || (
                (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.student_email_id || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.gr_number || '').toLowerCase().includes(search.toLowerCase()) ||
                (s.roll_number || '').toLowerCase().includes(search.toLowerCase())
            );
            const matchesProgram = !selectedProgram || s.program === selectedProgram;
            return matchesSearch && matchesProgram;
        });

        return (
            <div className="p-6">
                {contextHolder}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Students</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition font-medium" onClick={() => setView('import')}>
                            Data Import
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchStudents} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Student
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80" placeholder="Search ID, Name or Email..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <select 
                        className="border border-gray-300 rounded px-3 py-2 text-sm w-60" 
                        value={selectedProgram} 
                        onChange={(e) => setSelectedProgram(e.target.value)}
                    >
                        <option value="">Filter by Program...</option>
                        {programs.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {(search || selectedProgram) && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={() => { setSearch(''); setSelectedProgram(''); }}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {!loadingList && `${Math.min(visibleCount, filtered.length)} of ${filtered.length}`}
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="px-4 py-3 font-medium text-gray-600">GR No.</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Roll No.</th>
                                <th className="px-4 py-3 font-medium text-gray-600">First Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Last Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Mobile</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Joining Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="9" className="text-center py-10 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1">No Students Found</p>
                                        <p className="text-sm">Try adjusting your search or add a new student.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.slice(0, visibleCount).map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                                                row.enabled ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                                            }`}>
                                                {row.enabled ? 'Active/Enabled' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 font-bold">{row.gr_number || '-'}</td>
                                        <td className="px-4 py-3 text-gray-700 font-bold">{row.roll_number || '-'}</td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.first_name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 font-medium">{row.last_name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500 italic">{row.student_email_id || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.student_mobile_number || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.joining_date || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {!loadingList && filtered.length > 0 && (
                        <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden shadow-sm">
                                {[20, 100, 500, 2500].map((size) => (
                                    <button
                                        key={size}
                                        className={`px-3 py-1.5 text-xs font-semibold border-r last:border-r-0 hover:bg-gray-50 transition ${
                                            pageSize === size ? 'bg-gray-100 text-gray-800' : 'text-gray-600'
                                        }`}
                                        onClick={() => setPageSize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                            {visibleCount < filtered.length && (
                                <button
                                    className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition"
                                    onClick={() => setVisibleCount(prev => prev + pageSize)}
                                >
                                    Load More
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Form View
    if (loadingForm) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                {contextHolder}
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading student data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20">
            {contextHolder}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                        {editingRecord ? `${form.first_name || ''} ${form.last_name || ''}`.trim() || editingRecord : 'New Student'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
                    )}
                    {editingRecord && (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                            form.enabled ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                        }`}>
                            {form.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={handleDelete}>Delete</button>
                    )}
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="flex gap-8 mb-8 border-b border-gray-100">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-medium transition-all relative ${
                            activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                {/* ─── Details Tab ─── */}
                {activeTab === 'Details' && (
                    <div className="space-y-10">
                        <div className="flex items-center gap-2 mb-2 p-3 bg-gray-50/50 border border-gray-100 rounded-lg w-fit">
                            <input
                                type="checkbox"
                                id="enabled_chk"
                                checked={!!form.enabled}
                                onChange={e => updateField('enabled', e.target.checked ? 1 : 0)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            <label htmlFor="enabled_chk" className="text-sm font-semibold text-gray-700 cursor-pointer">Account Enabled</label>
                        </div>

                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div>
                                <label className={labelStyle}>First Name *</label>
                                <input className={inputStyle} value={form.first_name || ''} onChange={e => updateField('first_name', e.target.value)} placeholder="First Name" />
                            </div>
                            <div>
                                <label className={labelStyle}>Naming Series</label>
                                <select className={inputStyle} value={form.naming_series || ''} onChange={e => updateField('naming_series', e.target.value)}>
                                    <option value="EDU-STU-.YYYY.-">EDU-STU-.YYYY.-</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Middle Name</label>
                                <input className={inputStyle} value={form.middle_name || ''} onChange={e => updateField('middle_name', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Joining Date</label>
                                <input type="date" className={inputStyle} value={form.joining_date || ''} onChange={e => updateField('joining_date', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>GR Number</label>
                                <input className={inputStyle} value={form.gr_number || ''} onChange={e => updateField('gr_number', e.target.value)} placeholder="GR Number" />
                            </div>
                            <div>
                                <label className={labelStyle}>User ID (Optional)</label>
                                <input className={inputStyle} value={form.user || ''} onChange={e => updateField('user', e.target.value)} placeholder="ERPNext User ID" />
                            </div>
                            <div>
                                <label className={labelStyle}>Roll Number</label>
                                <input className={inputStyle} value={form.roll_number || ''} onChange={e => updateField('roll_number', e.target.value)} placeholder="Roll Number" />
                            </div>
                            <div>
                                <label className={labelStyle}>Program</label>
                                <select className={inputStyle} value={form.program || ''} onChange={e => updateField('program', e.target.value)}>
                                    <option value="">Select Program...</option>
                                    {programs.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Last Name</label>
                                <input className={inputStyle} value={form.last_name || ''} onChange={e => updateField('last_name', e.target.value)} placeholder="Last Name" />
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                            <h3 className={sectionTitleStyle}>Personal Details</h3>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <div>
                                    <label className={labelStyle}>Student Email Address *</label>
                                    <input type="email" className={inputStyle} value={form.student_email_id} onChange={e => updateField('student_email_id', e.target.value)} placeholder="email@college.edu" />
                                </div>
                                <div>
                                    <label className={labelStyle}>Student Mobile Number</label>
                                    <input className={inputStyle} value={form.student_mobile_number} onChange={e => updateField('student_mobile_number', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Date of Birth</label>
                                    <input type="date" className={inputStyle} value={form.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Gender</label>
                                    <select className={inputStyle} value={form.gender} onChange={e => updateField('gender', e.target.value)}>
                                        {GENDERS.map(g => <option key={g} value={g}>{g || 'Select Gender...'}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Blood Group</label>
                                    <select className={inputStyle} value={form.blood_group} onChange={e => updateField('blood_group', e.target.value)}>
                                        {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g || 'Select Group...'}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Nationality</label>
                                    <input className={inputStyle} value={form.nationality} onChange={e => updateField('nationality', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Address Tab ─── */}
                {activeTab === 'Address' && (
                    <div>
                        <h3 className={sectionTitleStyle}>Residential Address</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div>
                                <label className={labelStyle}>Address Line 1</label>
                                <input className={inputStyle} value={form.address_line_1} onChange={e => updateField('address_line_1', e.target.value)} placeholder="House No, Street" />
                            </div>
                            <div>
                                <label className={labelStyle}>City</label>
                                <input className={inputStyle} value={form.city} onChange={e => updateField('city', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Address Line 2</label>
                                <input className={inputStyle} value={form.address_line_2} onChange={e => updateField('address_line_2', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>State</label>
                                <input className={inputStyle} value={form.state} onChange={e => updateField('state', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Pincode</label>
                                <input className={inputStyle} value={form.pincode} onChange={e => updateField('pincode', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Country</label>
                                <select className={inputStyle} value={form.country} onChange={e => updateField('country', e.target.value)}>
                                    <option value="">Select Country...</option>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Relations Tab ─── */}
                {activeTab === 'Relations' && (
                    <div className="space-y-12">
                        <div>
                            <h3 className={sectionTitleStyle}>Guardian Details</h3>
                            {form.guardians.map((g, idx) => (
                                <div key={idx} className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50/40 relative shadow-sm">
                                    <button onClick={() => removeGuardian(idx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 font-bold transition" title="Remove Guardian">✕</button>
                                    
                                    <div className="flex gap-6 mb-6 pb-4 border-b border-gray-100">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                            <input type="radio" className="text-blue-600 focus:ring-blue-500" name={`g_type_${idx}`} checked={!g.is_new} onChange={() => updateGuardian(idx, 'is_new', false)} /> Link Existing Guardian
                                        </label>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                            <input type="radio" className="text-blue-600 focus:ring-blue-500" name={`g_type_${idx}`} checked={!!g.is_new} onChange={() => updateGuardian(idx, 'is_new', true)} /> Create New Guardian
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                        <div>
                                            <label className={labelStyle}>Relation with Student *</label>
                                            <select className={inputStyle} value={g.relation || ''} onChange={e => updateGuardian(idx, 'relation', e.target.value)}>
                                                <option value="">Select Relation...</option>
                                                <option value="Father">Father</option>
                                                <option value="Mother">Mother</option>
                                                <option value="Others">Others</option>
                                            </select>
                                        </div>
                                        
                                        {!g.is_new ? (
                                            <>
                                                <div>
                                                    <label className={labelStyle}>Select Guardian *</label>
                                                    <select className={inputStyle} value={g.guardian || ''} onChange={e => updateGuardian(idx, 'guardian', e.target.value)}>
                                                        <option value="">Link Guardian...</option>
                                                        {guardiansList.map(gl => <option key={gl.name} value={gl.name}>{gl.name} ({gl.guardian_name})</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={labelStyle}>Guardian Name</label>
                                                    <input className={`${inputStyle} bg-gray-100`} value={g.guardian_name || ''} readOnly />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className={labelStyle}>Guardian Name *</label>
                                                    <input className={inputStyle} value={g.guardian_name || ''} onChange={e => updateGuardian(idx, 'guardian_name', e.target.value)} placeholder="Full Name" />
                                                </div>
                                                <div>
                                                    <label className={labelStyle}>Email Address</label>
                                                    <input type="email" className={inputStyle} value={g.email_address || ''} onChange={e => updateGuardian(idx, 'email_address', e.target.value)} placeholder="email@example.com" />
                                                </div>
                                                <div>
                                                    <label className={labelStyle}>Mobile Number</label>
                                                    <input className={inputStyle} value={g.mobile_number || ''} onChange={e => updateGuardian(idx, 'mobile_number', e.target.value)} placeholder="+91 ..." />
                                                </div>
                                                <div>
                                                    <label className={labelStyle}>Occupation</label>
                                                    <input className={inputStyle} value={g.occupation || ''} onChange={e => updateGuardian(idx, 'occupation', e.target.value)} placeholder="Occupation" />
                                                </div>
                                                <div>
                                                    <label className={labelStyle}>Designation</label>
                                                    <input className={inputStyle} value={g.designation || ''} onChange={e => updateGuardian(idx, 'designation', e.target.value)} placeholder="Designation" />
                                                </div>
                                                <div>
                                                    <label className={labelStyle}>Education</label>
                                                    <input className={inputStyle} value={g.education || ''} onChange={e => updateGuardian(idx, 'education', e.target.value)} placeholder="Qualification" />
                                                </div>
                                                <div>
                                                    <label className={labelStyle}>Alternate Number</label>
                                                    <input className={inputStyle} value={g.alternate_number || ''} onChange={e => updateGuardian(idx, 'alternate_number', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className={labelStyle}>Date of Birth</label>
                                                    <input type="date" className={inputStyle} value={g.date_of_birth || ''} onChange={e => updateGuardian(idx, 'date_of_birth', e.target.value)} />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className={labelStyle}>Work Address</label>
                                                    <textarea className={`${inputStyle} h-16 resize-none`} value={g.work_address || ''} onChange={e => updateGuardian(idx, 'work_address', e.target.value)} placeholder="Full Address" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {form.guardians.length === 0 && (
                                <div className="text-center py-8 mb-6 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/30">
                                    No Guardians Linked
                                </div>
                            )}
                            <button onClick={addGuardian} className="px-4 py-2 bg-white border border-gray-200 text-blue-600 text-[13px] font-semibold rounded-md hover:bg-blue-50 transition shadow-sm">+ Add Guardian</button>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                            <h3 className={sectionTitleStyle}>Sibling Details</h3>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                        <tr>
                                            <th className="px-3 py-2.5 text-left w-12">No.</th>
                                            <th className="px-3 py-2.5 text-left">Full Name</th>
                                            <th className="px-3 py-2.5 text-left">Gender</th>
                                            <th className="px-3 py-2.5 text-left">Program</th>
                                            <th className="px-3 py-2.5 text-left">DOB</th>
                                            <th className="px-3 py-2 text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {form.siblings.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-10 text-gray-400 italic">No Siblings Recorded</td></tr>
                                        ) : (
                                            form.siblings.map((s, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                    <td className="px-3 py-2.5"><input className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400 font-medium" value={s.full_name} onChange={e => updateSibling(idx, 'full_name', e.target.value)} /></td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none" value={s.gender} onChange={e => updateSibling(idx, 'gender', e.target.value)}>
                                                            {GENDERS.map(g => <option key={g} value={g}>{g || '—'}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none" value={s.program} onChange={e => updateSibling(idx, 'program', e.target.value)}>
                                                            <option value="">—</option>
                                                            {programs.map(p => <option key={p} value={p}>{p}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5"><input type="date" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none" value={s.date_of_birth} onChange={e => updateSibling(idx, 'date_of_birth', e.target.value)} /></td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button onClick={() => removeSibling(idx)} className="text-gray-300 hover:text-red-500 font-bold transition opacity-0 group-hover:opacity-100 italic">✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={addSibling} className="mt-3 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm">+ Add Sibling</button>
                        </div>
                    </div>
                )}

                {/* ─── Customer Details Tab ─── */}
                {activeTab === 'Customer Details' && (
                    <div className="max-w-xl">
                        <h3 className={sectionTitleStyle}>Linked Customer Data</h3>
                        <div>
                            <label className={labelStyle}>Customer Group</label>
                            <select className={inputStyle} value={form.customer_group} onChange={e => updateField('customer_group', e.target.value)}>
                                <option value="">Select Group...</option>
                                {customerGroups.map(cg => <option key={cg} value={cg}>{cg}</option>)}
                            </select>
                            <p className="mt-2 text-[12px] text-gray-400 italic">Changing this affects the default accounting settings for this student.</p>
                        </div>
                    </div>
                )}

                {/* ─── Exit Tab ─── */}
                {activeTab === 'Exit' && (
                    <div className="space-y-10">
                        <h3 className={sectionTitleStyle}>Student Exit Clearance</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div>
                                <label className={labelStyle}>Date of Leaving</label>
                                <input type="date" className={inputStyle} value={form.date_of_leaving} onChange={e => updateField('date_of_leaving', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Leaving Certificate Number</label>
                                <input className={inputStyle} value={form.leaving_certificate_number} onChange={e => updateField('leaving_certificate_number', e.target.value)} placeholder="Ref No." />
                            </div>
                            <div className="col-span-2 max-w-2xl">
                                <label className={labelStyle}>Reason For Leaving</label>
                                <textarea className={`${inputStyle} min-h-[120px] resize-none`} value={form.reason_for_leaving} onChange={e => updateField('reason_for_leaving', e.target.value)} placeholder="Provide detailed remarks..." />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Student;
