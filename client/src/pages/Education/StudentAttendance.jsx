import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';
import * as XLSX from 'xlsx';

const emptyForm = () => ({
    naming_series: 'EDU-ATT-.YYYY.-',
    date: new Date().toISOString().split('T')[0],
    student: '',
    status: 'Present',
    course_schedule: '',
    program: '',
    student_group: '',
});

const StudentAttendance = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [attendanceList, setAttendanceList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [filters, setFilters] = useState({ name: '', student: '', student_name: '', program: '', student_group: '', status: '', start_date: '', end_date: '' });
    const [pageSize, setPageSize] = useState(20);
    const [visibleCount, setVisibleCount] = useState(20);

    useEffect(() => {
        setVisibleCount(pageSize);
    }, [filters, pageSize]);

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Filtered dropdown states
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [filteredStudentGroups, setFilteredStudentGroups] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // List view filtered dropdown states
    const [filteredFilterStudents, setFilteredFilterStudents] = useState([]);
    const [filteredFilterStudentGroups, setFilteredFilterStudentGroups] = useState([]);
    const [loadingFilterStudents, setLoadingFilterStudents] = useState(false);

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        students: [],
        courseSchedules: [],
        programs: [],
        studentGroups: [],
        masterStudents: [],
        masterStudentGroups: [],
        statusOptions: ['Present', 'Absent', 'On Leave', 'Half Day'],
        namingSeries: ['EDU-ATT-.YYYY.-'],
    });

    // --- Data Import States ---
    const [importView, setImportView] = useState('list'); // 'list' or 'form'
    const [importList, setImportList] = useState(() => {
        const stored = localStorage.getItem('attendance_imports');
        return stored ? JSON.parse(stored) : [
            {
                id: "ATT-IMP-2026-00001",
                status: "Success",
                docType: "Student Attendance",
                importType: "Insert New Records",
                importFile: "Student_Attendance_Template.xlsx",
                time: "2 hours ago",
                logs: [{ type: 'success', msg: 'Successfully imported 12 records.' }]
            }
        ];
    });
    const [activeImportRun, setActiveImportRun] = useState(null);
    const [importType, setImportType] = useState('Insert New Records');
    const [submitAfterImport, setSubmitAfterImport] = useState(true);
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
        id: true,
        series: false,
        student: true,
        student_name: true,
        date: true,
        status: true,
        student_group: true,
        program: true,
        course_schedule: false,
        leave_application: false,
        amended_from: false
    });

    // --- Data Import Logics ---
    const handleDownloadTemplate = async () => {
        const headers = [];
        if (selectedFields.id) headers.push("ID");
        if (selectedFields.series) headers.push("Series");
        if (selectedFields.student) headers.push("Student");
        if (selectedFields.student_name) headers.push("Student Name");
        if (selectedFields.date) headers.push("Date");
        if (selectedFields.status) headers.push("Status");
        if (selectedFields.student_group) headers.push("Student Group");
        if (selectedFields.program) headers.push("Program");
        if (selectedFields.course_schedule) headers.push("Course Schedule");
        if (selectedFields.leave_application) headers.push("Leave Application");
        if (selectedFields.amended_from) headers.push("Amended From");

        const rows = [headers];

        const getRowData = (idVal, studentVal, studentNameVal, dateVal, statusVal, groupVal, programVal) => {
            const row = [];
            if (selectedFields.id) row.push(idVal);
            if (selectedFields.series) row.push("");
            if (selectedFields.student) row.push(studentVal);
            if (selectedFields.student_name) row.push(studentNameVal);
            if (selectedFields.date) row.push(dateVal);
            if (selectedFields.status) row.push(statusVal);
            if (selectedFields.student_group) row.push(groupVal);
            if (selectedFields.program) row.push(programVal);
            if (selectedFields.course_schedule) row.push("");
            if (selectedFields.leave_application) row.push("");
            if (selectedFields.amended_from) row.push("");
            return row;
        };

        const cols = [];
        if (selectedFields.id) cols.push({ wch: 25 });
        if (selectedFields.series) cols.push({ wch: 15 });
        if (selectedFields.student) cols.push({ wch: 20 });
        if (selectedFields.student_name) cols.push({ wch: 25 });
        if (selectedFields.date) cols.push({ wch: 15 });
        if (selectedFields.status) cols.push({ wch: 20 });
        if (selectedFields.student_group) cols.push({ wch: 20 });
        if (selectedFields.program) cols.push({ wch: 20 });
        if (selectedFields.course_schedule) cols.push({ wch: 20 });
        if (selectedFields.leave_application) cols.push({ wch: 20 });
        if (selectedFields.amended_from) cols.push({ wch: 20 });

        if (templateType === '5 Records' || templateType === 'All Records') {
            notification.info({ message: 'Fetching existing attendance records...', duration: 2 });
            const limit = templateType === '5 Records' ? 5 : 'None';
            try {
                const [attRes, peRes] = await Promise.all([
                    API.get('/api/resource/Student Attendance', {
                        params: {
                            fields: JSON.stringify(["name", "student", "student_name", "date", "status", "student_group"]),
                            limit_page_length: limit,
                            order_by: 'date desc'
                        }
                    }),
                    API.get('/api/resource/Program Enrollment', {
                        params: {
                            fields: JSON.stringify(["student", "program"]),
                            limit_page_length: 'None'
                        }
                    }).catch(() => ({ data: { data: [] } }))
                ]);
                
                let studentProgramMap = {};
                peRes.data.data?.forEach(pe => {
                    if (pe.student) {
                        studentProgramMap[pe.student] = pe.program || '';
                    }
                });

                attRes.data.data?.forEach(rec => {
                    let formattedDate = rec.date || '';
                    if (formattedDate && formattedDate.includes('-')) {
                        const parts = formattedDate.split('-');
                        if (parts[0].length === 4) { // YYYY-MM-DD to DD-MM-YYYY
                            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                    }

                    let program = studentProgramMap[rec.student] || '';
                    if (!program && rec.student_group) {
                        const foundGroup = dropdowns.masterStudentGroups?.find(g => g.value === rec.student_group);
                        if (foundGroup) {
                            program = foundGroup.program || '';
                        }
                    }

                    rows.push(getRowData(
                        rec.name || '',
                        rec.student || '',
                        rec.student_name || '',
                        formattedDate,
                        rec.status || 'Present',
                        rec.student_group || '',
                        program
                    ));
                });

                const ws = XLSX.utils.aoa_to_sheet(rows);
                ws['!cols'] = cols;

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Student Attendance Records");
                
                const filename = `Student_Attendance_Export.${templateFormat === 'CSV' ? 'csv' : 'xlsx'}`;
                if (templateFormat === 'CSV') {
                    XLSX.writeFile(wb, filename, { bookType: 'csv' });
                } else {
                    XLSX.writeFile(wb, filename);
                }
                notification.success({ message: `Export file ${filename} downloaded successfully.` });
                setShowTemplateModal(false);
                return;
            } catch (err) {
                console.error('Error exporting existing attendance records:', err);
                notification.error({ message: 'Export Failed', description: 'Failed to retrieve attendance records.' });
                return;
            }
        }

        // Blank Template Flow
        notification.info({ message: 'Fetching student group and program assignments...', duration: 2 });

        let studentProgramMap = {};
        let studentGroupMap = {};

        try {
            const [peRes, sgsRes] = await Promise.all([
                API.get('/api/resource/Program Enrollment', {
                    params: {
                        fields: JSON.stringify(["student", "program", "student_group"]),
                        limit_page_length: 'None'
                    }
                }).catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Student Group Student', {
                    params: {
                        fields: JSON.stringify(["parent", "student"]),
                        limit_page_length: 'None'
                    }
                }).catch(() => ({ data: { data: [] } }))
            ]);

            peRes.data.data?.forEach(pe => {
                if (pe.student) {
                    studentProgramMap[pe.student] = pe.program || '';
                    if (pe.student_group) {
                        studentGroupMap[pe.student] = pe.student_group;
                    }
                }
            });

            sgsRes.data.data?.forEach(sgs => {
                if (sgs.student && sgs.parent) {
                    studentGroupMap[sgs.student] = sgs.parent;
                }
            });
        } catch (err) {
            console.error('Error fetching student mappings for template:', err);
        }

        const targetStudents = dropdowns.masterStudents;

        targetStudents.forEach(st => {
            const studentId = st.value;
            const program = studentProgramMap[studentId] || '';
            let group = studentGroupMap[studentId] || '';

            if (!group && program) {
                const foundGroup = dropdowns.masterStudentGroups?.find(g => g.program === program);
                if (foundGroup) {
                    group = foundGroup.value;
                }
            }

            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            const formattedToday = `${day}-${month}-${year}`;

            rows.push(getRowData(
                "", // ID (empty for insert)
                studentId,
                st.label.split(' - ')[1] || '',
                formattedToday,
                "Present",
                group,
                program
            ));
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = cols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Student Attendance Template");
        
        const filename = `Student_Attendance_Import_Template.${templateFormat === 'CSV' ? 'csv' : 'xlsx'}`;
        if (templateFormat === 'CSV') {
            XLSX.writeFile(wb, filename, { bookType: 'csv' });
        } else {
            XLSX.writeFile(wb, filename);
        }
        notification.success({ message: `Template ${filename} downloaded successfully.` });
        setShowTemplateModal(false);
    };

    const getFilteredRecords = () => {
        return attendanceList.filter(row => {
            if (filters.name && !(row.name || '').toLowerCase().includes(filters.name.toLowerCase())) {
                return false;
            }
            if (filters.student && !(row.student || '').toLowerCase().includes(filters.student.toLowerCase())) {
                return false;
            }
            if (filters.student_name && !(row.student_name || '').toLowerCase().includes(filters.student_name.toLowerCase())) {
                return false;
            }
            if (filters.program) {
                const groupObj = dropdowns.masterStudentGroups?.find(g => g.value === row.student_group);
                if (!groupObj || groupObj.program !== filters.program) {
                    return false;
                }
            }
            if (filters.student_group && !(row.student_group || '').toLowerCase().includes(filters.student_group.toLowerCase())) {
                return false;
            }
            if (filters.status) {
                const docStatusName = row.docstatus === 0 ? 'Draft' : row.docstatus === 2 ? 'Cancelled' : row.status;
                if ((docStatusName || '').toLowerCase() !== filters.status.toLowerCase()) {
                    return false;
                }
            }
            if (filters.start_date && (!row.date || row.date < filters.start_date)) {
                return false;
            }
            if (filters.end_date && (!row.date || row.date > filters.end_date)) {
                return false;
            }
            return true;
        });
    };

    const handleDownloadAttendance = () => {
        const dataToExport = getFilteredRecords();
        if (dataToExport.length === 0) {
            notification.warning({ message: 'No Data', description: 'There are no attendance records to download.' });
            return;
        }

        const headers = ["ID", "Student ID", "Student Name", "Date", "Status", "Student Group"];
        const rows = [headers];

        dataToExport.forEach(row => {
            let docStatusName = row.status;
            if (row.docstatus === 0) docStatusName = 'Draft';
            else if (row.docstatus === 2) docStatusName = 'Cancelled';

            rows.push([
                row.name || '',
                row.student || '',
                row.student_name || '',
                row.date || '',
                docStatusName || '',
                row.student_group || ''
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance Records");

        const filename = `Student_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        notification.success({ message: 'Download Started', description: `Successfully exported ${dataToExport.length} records.` });
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
                    notification.error({ message: 'Error', description: 'The file is empty.' });
                    return;
                }
                
                setPreviewRows(jsonData);
                notification.success({ message: 'File parsed successfully.', description: `Found ${jsonData.length} rows.` });
            } catch (err) {
                console.error(err);
                notification.error({ message: 'Parsing Failed', description: 'Failed to read spreadsheet file.' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const fetchImportList = async () => {
        try {
            const res = await API.get('/api/resource/Data Import', {
                params: {
                    filters: JSON.stringify([["reference_doctype", "=", "Student Attendance"]]),
                    fields: JSON.stringify(["name", "status", "reference_doctype", "import_type", "creation", "import_file"]),
                    limit_page_length: 'None',
                    order_by: 'creation desc'
                }
            });

            const basicList = res.data.data || [];

            // Query Data Import Log to group counts dynamically
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
            const stored = localStorage.getItem('attendance_imports');
            if (stored) setImportList(JSON.parse(stored));
        }
    };

    const handleSelectImportRun = async (row) => {
        if (activeImportRun?.id === row.id) {
            setActiveImportRun(null);
            return;
        }

        // If logs are already loaded (e.g., from local storage or current session), display them immediately
        if (row.logs && row.logs.length > 0) {
            setActiveImportRun(row);
            return;
        }

        try {
            notification.info({ message: 'Fetching import logs...', duration: 1.5 });
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

                // Double parse if it's stored as a serialized JSON string containing an array
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
                notification.warning({ message: 'No detailed logs found for this import run.' });
            }
        } catch (err) {
            console.error('Failed to fetch Data Import logs:', err);
            notification.error({ message: 'Failed to fetch logs from server' });
            setActiveImportRun(row);
        }
    };

    const handleDeleteImport = async (id) => {
        if (!window.confirm(`Are you sure you want to delete the Data Import record "${id}"?`)) {
            return;
        }

        try {
            notification.info({ message: 'Deleting Data Import record...', duration: 1.5 });
            
            // Try to delete from ERPNext if it's not a temporary local ID
            if (!id.startsWith('ATT-IMP-')) {
                // 1. Fetch all linked Data Import Log records
                const logsRes = await API.get('/api/resource/Data Import Log', {
                    params: {
                        filters: JSON.stringify([["data_import", "=", id]]),
                        fields: JSON.stringify(["name"]),
                        limit_page_length: 'None'
                    }
                });
                const logsToDelete = logsRes.data.data || [];
                
                // 2. Delete each Data Import Log document
                for (let logDoc of logsToDelete) {
                    await API.delete(`/api/resource/Data Import Log/${encodeURIComponent(logDoc.name)}`);
                }
                
                // 3. Finally, delete the parent Data Import document
                await API.delete(`/api/resource/Data Import/${encodeURIComponent(id)}`);
            }
            
            // Filter out of local storage backup
            const stored = localStorage.getItem('attendance_imports');
            if (stored) {
                const parsed = JSON.parse(stored);
                const filtered = parsed.filter(item => item.id !== id);
                localStorage.setItem('attendance_imports', JSON.stringify(filtered));
            }
            
            // Update state
            setImportList(prev => prev.filter(item => item.id !== id));
            if (activeImportRun?.id === id) {
                setActiveImportRun(null);
            }
            notification.success({ message: 'Success', description: 'Data Import record deleted successfully.' });
        } catch (err) {
            console.error('Failed to delete Data Import record:', err);
            notification.error({ 
                message: 'Delete Failed', 
                description: err.response?.data?._server_messages 
                    ? JSON.parse(JSON.parse(err.response.data._server_messages)[0]).message
                    : err.message 
            });
        }
    };

    const handleStartImport = async () => {
        if (previewRows.length === 0) {
            notification.error({ message: 'Error', description: 'No records to import.' });
            return;
        }

        setImporting(true);
        setImportProgress(0);
        const logs = [];
        let successCount = 0;
        let failCount = 0;

        let dataImportName = null;
        try {
            const diRes = await API.post('/api/resource/Data Import', {
                reference_doctype: "Student Attendance",
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

        // 1. Pre-fetch existing attendance records to determine whether to perform insert (POST) or update (PUT)
        const studentIds = [];
        const dates = [];
        previewRows.forEach(row => {
            const studentId = row.Student || row['Student ID'];
            let rawDate = row.Date || row['Date (YYYY-MM-DD)'];
            if (studentId && !studentIds.includes(studentId)) {
                studentIds.push(studentId);
            }
            if (rawDate) {
                let formattedDate = rawDate;
                if (typeof rawDate === 'number') {
                    formattedDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000)).toISOString().split('T')[0];
                } else if (typeof rawDate === 'string' && rawDate.includes('-')) {
                    const parts = rawDate.split('-');
                    if (parts[0].length === 2 && parts[2].length === 4) {
                        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }
                if (formattedDate && !dates.includes(formattedDate)) {
                    dates.push(formattedDate);
                }
            }
        });

        const existingAttendanceMap = {};
        if (studentIds.length > 0 && dates.length > 0) {
            try {
                notification.info({ message: 'Checking for existing attendance records...', duration: 1 });
                const lookupRes = await API.get('/api/resource/Student Attendance', {
                    params: {
                        filters: JSON.stringify([
                            ["student", "in", studentIds],
                            ["date", "in", dates]
                        ]),
                        fields: JSON.stringify(["name", "student", "date"]),
                        limit_page_length: 'None'
                    }
                });
                lookupRes.data.data?.forEach(rec => {
                    const key = `${rec.student}_${rec.date}`;
                    existingAttendanceMap[key] = rec.name;
                });
            } catch (err) {
                console.error('Failed to pre-fetch existing attendance records:', err);
            }
        }

        for (let i = 0; i < previewRows.length; i++) {
            const row = previewRows[i];
            const rowNum = i + 2; // Excel row number (1-based + header)
            
            const studentId = row.Student || row['Student ID'];
            let rawDate = row.Date || row['Date (YYYY-MM-DD)'];
            const status = row.Status || row['Status (Present/Absent/On Leave/Half Day)'];
            const studentGroup = row['Student Group'] || row['student_group'];

            try {
                if (!studentId) {
                    throw new Error("Missing 'Student' ID");
                }
                if (!status) {
                    throw new Error("Missing 'Status'");
                }

                let formattedDate = rawDate;
                if (typeof rawDate === 'number') {
                    formattedDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000)).toISOString().split('T')[0];
                } else if (typeof rawDate === 'string' && rawDate.includes('-')) {
                    const parts = rawDate.split('-');
                    if (parts[0].length === 2 && parts[2].length === 4) {
                        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }

                if (!formattedDate) {
                    throw new Error("Missing 'Date'");
                }

                const payload = {
                    student: studentId,
                    date: formattedDate,
                    status: status,
                    student_group: studentGroup || null,
                    docstatus: submitAfterImport ? 1 : 0
                };

                const key = `${studentId}_${formattedDate}`;
                const existingId = row.ID || existingAttendanceMap[key];

                if (existingId) {
                    // Update existing record
                    await API.put(`/api/resource/Student Attendance/${encodeURIComponent(existingId)}`, payload);
                    successCount++;
                    logs.push({ type: 'success', msg: `Row ${rowNum}: Successfully updated ID ${existingId} status to "${status}"` });
                } else {
                    // Insert new record
                    const res = await API.post('/api/resource/Student Attendance', payload);
                    successCount++;
                    logs.push({ type: 'success', msg: `Row ${rowNum}: Successfully created record ${res.data.data.name}` });
                }
            } catch (err) {
                failCount++;
                const errMsg = err.response?.data?._server_messages 
                    ? JSON.parse(JSON.parse(err.response.data._server_messages)[0]).message 
                    : err.response?.data?.message || err.message;
                logs.push({ type: 'error', msg: `Row ${rowNum}: Failed - ${errMsg}` });
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

        // Save backup to localStorage
        const newRun = {
            id: dataImportName || `ATT-IMP-${Date.now().toString().slice(-5)}`,
            status: finalStatus,
            docType: "Student Attendance",
            importType: importType,
            importFile: selectedFile?.name || 'Uploaded File.xlsx',
            time: new Date().toLocaleString(),
            successCount: successCount,
            failureCount: failCount,
            totalRecords: previewRows.length,
            logs: logs
        };
        const updatedList = [newRun, ...importList.filter(item => item.id !== dataImportName)];
        localStorage.setItem('attendance_imports', JSON.stringify(updatedList));

        notification.success({
            message: 'Import Run Finished',
            description: `Successfully processed ${successCount} records. Failed: ${failCount}`
        });
        setImporting(false);
        setImportView('list');
        fetchImportList();
    };

    useEffect(() => {
        fetchDropdowns();
    }, []);

    useEffect(() => {
        const updateFilteredFilterData = async () => {
            // 1. Filter Student Groups in Filter Bar
            if (filters.program) {
                setFilteredFilterStudentGroups(
                    dropdowns.masterStudentGroups.filter(g => g.program === filters.program)
                );
            } else {
                setFilteredFilterStudentGroups(dropdowns.masterStudentGroups || []);
            }

            // 2. Filter Students in Filter Bar
            if (filters.student_group) {
                setLoadingFilterStudents(true);
                try {
                    const res = await API.get(`/api/resource/Student Group/${encodeURIComponent(filters.student_group)}`);
                    const list = res.data.data.students?.map(s => ({
                        value: s.student,
                        label: `${s.student} - ${s.student_name}`
                    })) || [];
                    setFilteredFilterStudents(list);
                } catch (err) {
                    console.error('Error fetching filter student group students:', err);
                } finally {
                    setLoadingFilterStudents(false);
                }
            } else if (filters.program) {
                setLoadingFilterStudents(true);
                try {
                    const res = await API.get('/api/resource/Program Enrollment', {
                        params: {
                            filters: JSON.stringify([["program", "=", filters.program]]),
                            fields: JSON.stringify(["student", "student_name"]),
                            limit_page_length: 'None'
                        }
                    });
                    const list = res.data.data?.map(d => ({
                        value: d.student,
                        label: `${d.student} - ${d.student_name}`
                    })) || [];
                    setFilteredFilterStudents(list);
                } catch (err) {
                    console.error('Error fetching filter program enrollment students:', err);
                } finally {
                    setLoadingFilterStudents(false);
                }
            } else {
                setFilteredFilterStudents(dropdowns.masterStudents || []);
            }
        };

        updateFilteredFilterData();
    }, [filters.program, filters.student_group, dropdowns.masterStudentGroups, dropdowns.masterStudents]);

    useEffect(() => {
        if (view === 'list') {
            fetchAttendanceList();
        } else if (view === 'import') {
            fetchImportList();
        } else {
            if (editingRecord) {
                fetchAttendance(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const safeGet = (url) => API.get(url).catch(() => ({ data: { data: [] } }));
            const [sRes, csRes, pRes, sgRes] = await Promise.all([
                safeGet('/api/resource/Student?fields=["name","first_name","last_name"]&limit_page_length=None'),
                safeGet('/api/resource/Course Schedule?limit_page_length=None'),
                safeGet('/api/resource/Program?limit_page_length=None'),
                safeGet('/api/resource/Student Group?fields=["name","program"]&limit_page_length=None'),
            ]);
            const studentsList = sRes.data.data?.map(d => ({ 
                value: d.name, 
                label: `${d.name} - ${d.first_name || ''} ${d.last_name || ''}`.trim() 
            })) || [];
            const studentGroupsList = sgRes.data.data?.map(d => ({ 
                value: d.name, 
                label: d.name,
                program: d.program 
            })) || [];

            setDropdowns(prev => ({
                ...prev,
                students: studentsList,
                masterStudents: studentsList,
                courseSchedules: csRes.data.data?.map(d => ({ value: d.name, label: d.name })) || [],
                programs: pRes.data.data?.map(d => ({ value: d.name, label: d.name })) || [],
                studentGroups: studentGroupsList,
                masterStudentGroups: studentGroupsList,
            }));
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    useEffect(() => {
        const updateFilteredData = async () => {
            // 1. Filter Student Groups
            if (form.program) {
                setFilteredStudentGroups(
                    dropdowns.masterStudentGroups.filter(g => g.program === form.program)
                );
            } else {
                setFilteredStudentGroups(dropdowns.masterStudentGroups || []);
            }

            // 2. Filter Students
            if (form.student_group) {
                setLoadingStudents(true);
                try {
                    const res = await API.get(`/api/resource/Student Group/${encodeURIComponent(form.student_group)}`);
                    const list = res.data.data.students?.map(s => ({
                        value: s.student,
                        label: `${s.student} - ${s.student_name}`
                    })) || [];
                    setFilteredStudents(list);
                } catch (err) {
                    console.error('Error fetching student group students:', err);
                } finally {
                    setLoadingStudents(false);
                }
            } else if (form.program) {
                setLoadingStudents(true);
                try {
                    const res = await API.get('/api/resource/Program Enrollment', {
                        params: {
                            filters: JSON.stringify([["program", "=", form.program]]),
                            fields: JSON.stringify(["student", "student_name"]),
                            limit_page_length: 'None'
                        }
                    });
                    const list = res.data.data?.map(d => ({
                        value: d.student,
                        label: `${d.student} - ${d.student_name}`
                    })) || [];
                    setFilteredStudents(list);
                } catch (err) {
                    console.error('Error fetching program enrollment students:', err);
                } finally {
                    setLoadingStudents(false);
                }
            } else {
                setFilteredStudents(dropdowns.masterStudents || []);
            }
        };

        if (view === 'form') {
            updateFilteredData();
        }
    }, [form.program, form.student_group, dropdowns.masterStudents, dropdowns.masterStudentGroups, view]);

    const fetchAttendanceList = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Student Attendance?fields=["name","student","student_name","date","status","student_group","docstatus"]&limit_page_length=None&order_by=date desc';
            const response = await API.get(url);
            setAttendanceList(response.data.data || []);
        } catch (err) {
            console.error('Error fetching attendance list:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchAttendance = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Student Attendance/${encodeURIComponent(id)}`);
            setForm(res.data.data);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            notification.error({ message: 'Error', description: 'Failed to load attendance record.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const handleSave = async () => {
        if (!form.student || !form.date || !form.status) {
            notification.warning({ message: 'Missing Fields', description: 'Student, Date and Status are required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Student Attendance/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Attendance updated successfully.' });
                fetchAttendance(editingRecord);
            } else {
                const res = await API.post('/api/resource/Student Attendance', form);
                notification.success({ message: 'Attendance recorded as Draft.' });
                const newDocName = res.data.data.name;
                setEditingRecord(newDocName);
                fetchAttendance(newDocName);
            }
        } catch (err) {
            console.error('Save error:', err);
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitDoc = async () => {
        if (!window.confirm(`Permanently Submit ${editingRecord}?`)) return;
        setSaving(true);
        try {
            await API.put(`/api/resource/Student Attendance/${encodeURIComponent(editingRecord)}`, {
                ...form,
                docstatus: 1
            });
            notification.success({ message: 'Document Submitted Successfully.' });
            fetchAttendance(editingRecord);
        } catch (err) {
            console.error('Submit error:', err);
            notification.error({ message: 'Submission Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelDoc = async () => {
        if (!window.confirm(`Cancel ${editingRecord}?`)) return;
        setSaving(true);
        try {
            await API.put(`/api/resource/Student Attendance/${encodeURIComponent(editingRecord)}`, {
                docstatus: 2
            });
            notification.success({ message: 'Document Cancelled.' });
            fetchAttendance(editingRecord);
        } catch (err) {
            console.error('Cancel error:', err);
            notification.error({ message: 'Cancel Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
        try {
            await API.delete(`/api/resource/Student Attendance/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Attendance record deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

    if (view === 'import') {
        return (
            <div className="p-6">
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
                            ← Back to Attendance
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
                                            value="Student Attendance" 
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

                            {previewRows.length > 0 && (
                                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-scaleUp">
                                    <h2 className="font-bold text-gray-800 text-base border-b pb-2 mb-3">Data Preview ({previewRows.length} Rows)</h2>
                                    <div className="max-h-80 overflow-auto border border-gray-200 rounded-lg">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 border-b sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 font-bold text-gray-600">Sr. No</th>
                                                    <th className="px-3 py-2 font-bold text-gray-600">Student ID</th>
                                                    <th className="px-3 py-2 font-bold text-gray-600">Student Name</th>
                                                    <th className="px-3 py-2 font-bold text-gray-600">Date</th>
                                                    <th className="px-3 py-2 font-bold text-gray-600">Status</th>
                                                    <th className="px-3 py-2 font-bold text-gray-600">Student Group</th>
                                                    <th className="px-3 py-2 font-bold text-gray-600">Program</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewRows.slice(0, 10).map((row, idx) => (
                                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                                        <td className="px-3 py-2 font-semibold text-gray-400">{idx + 1}</td>
                                                        <td className="px-3 py-2 font-medium text-gray-700">{row.Student || row['Student ID'] || '-'}</td>
                                                        <td className="px-3 py-2 text-gray-600">{row['Student Name'] || row.student_name || '-'}</td>
                                                        <td className="px-3 py-2 text-gray-600">{row.Date || row['Date (YYYY-MM-DD)'] || '-'}</td>
                                                        <td className="px-3 py-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                                                (row.Status || row['Status (Present/Absent/On Leave/Half Day)'] || 'Present').toLowerCase() === 'present' 
                                                                    ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' 
                                                                    : 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                                                            }`}>
                                                                {row.Status || row['Status (Present/Absent/On Leave/Half Day)'] || 'Present'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-600">{row['Student Group'] || row.student_group || '-'}</td>
                                                        <td className="px-3 py-2 text-gray-600">{row.Program || row.program || '-'}</td>
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
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                                <h2 className="font-bold text-gray-800 text-base border-b pb-2">Import Options</h2>
                                
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 font-semibold">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                            checked={submitAfterImport}
                                            onChange={(e) => setSubmitAfterImport(e.target.checked)}
                                            disabled={importing}
                                        />
                                        Submit After Import
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 font-semibold">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                            checked={dontSendEmails}
                                            onChange={(e) => setDontSendEmails(e.target.checked)}
                                            disabled={importing}
                                        />
                                        Don't Send Emails
                                    </label>
                                </div>
                            </div>

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
                        <div className="bg-white rounded-xl shadow-xl w-[500px] overflow-hidden border border-gray-200 transform scale-100 transition-all duration-300">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="font-bold text-gray-800 text-lg">Export Data</h3>
                                <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">File Type</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 font-semibold text-gray-700"
                                        value={templateFormat}
                                        onChange={(e) => setTemplateFormat(e.target.value)}
                                    >
                                        <option value="Excel">Excel (xlsx)</option>
                                        <option value="CSV">CSV</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Export Type</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 font-semibold text-gray-700"
                                        value={templateType}
                                        onChange={(e) => setTemplateType(e.target.value)}
                                    >
                                        <option value="Blank Template">Blank Template</option>
                                        <option value="5 Records">5 Student Records Template</option>
                                        <option value="All Records">All Student Records Template</option>
                                    </select>
                                </div>

                                <div className="border-t pt-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Fields to Insert</label>
                                    
                                    <div className="flex gap-1.5 mb-2.5">
                                        <button 
                                            type="button" 
                                            className="px-2 py-0.5 text-[10px] bg-gray-150 hover:bg-gray-200 border rounded font-bold text-gray-600 transition"
                                            onClick={() => setSelectedFields({
                                                id: true, student: true, date: true, status: true,
                                                student_name: true, student_group: true, program: true,
                                                course_schedule: true, leave_application: true, amended_from: true, series: true
                                            })}
                                        >
                                            Select All
                                        </button>
                                        <button 
                                            type="button" 
                                            className="px-2 py-0.5 text-[10px] bg-gray-150 hover:bg-gray-200 border rounded font-bold text-gray-600 transition"
                                            onClick={() => setSelectedFields({
                                                id: true, student: true, date: true, status: true,
                                                student_name: false, student_group: false, program: false,
                                                course_schedule: false, leave_application: false, amended_from: false, series: false
                                            })}
                                        >
                                            Select Mandatory
                                        </button>
                                        <button 
                                            type="button" 
                                            className="px-2 py-0.5 text-[10px] bg-gray-150 hover:bg-gray-200 border rounded font-bold text-gray-600 transition"
                                            onClick={() => setSelectedFields({
                                                id: true, student: false, date: false, status: false,
                                                student_name: false, student_group: false, program: false,
                                                course_schedule: false, leave_application: false, amended_from: false, series: false
                                            })}
                                        >
                                            Unselect All
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs max-h-[140px] overflow-y-auto border border-gray-200 rounded p-2.5 bg-gray-50 font-semibold">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedFields.id} 
                                                onChange={(e) => setSelectedFields(prev => ({ ...prev, id: e.target.checked }))}
                                                className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-red-500 font-bold">ID</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedFields.series} 
                                                onChange={(e) => setSelectedFields(prev => ({ ...prev, series: e.target.checked }))}
                                                className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span>Series</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedFields.student} 
                                                onChange={(e) => setSelectedFields(prev => ({ ...prev, student: e.target.checked }))}
                                                className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-red-500 font-bold">Student</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedFields.student_name} 
                                                onChange={(e) => setSelectedFields(prev => ({ ...prev, student_name: e.target.checked }))}
                                                className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span>Student Name</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedFields.date} 
                                                onChange={(e) => setSelectedFields(prev => ({ ...prev, date: e.target.checked }))}
                                                className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-red-500 font-bold">Date</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedFields.status} 
                                                onChange={(e) => setSelectedFields(prev => ({ ...prev, status: e.target.checked }))}
                                                className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-red-500 font-bold">Status</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-semibold">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedFields.student_group} 
                                                onChange={(e) => setSelectedFields(prev => ({ ...prev, student_group: e.target.checked }))}
                                                className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span>Student Group</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedFields.program} 
                                                onChange={(e) => setSelectedFields(prev => ({ ...prev, program: e.target.checked }))}
                                                className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span>Program</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedFields.course_schedule} 
                                                onChange={(e) => setSelectedFields(prev => ({ ...prev, course_schedule: e.target.checked }))}
                                                className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span>Course Schedule</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedFields.leave_application} 
                                                onChange={(e) => setSelectedFields(prev => ({ ...prev, leave_application: e.target.checked }))}
                                                className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span>Leave Application</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedFields.amended_from} 
                                                onChange={(e) => setSelectedFields(prev => ({ ...prev, amended_from: e.target.checked }))}
                                                className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span>Amended From</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-1.5 text-[10px] text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-2.5 font-semibold">
                                    💡 Tips: The template will automatically include the columns you selected above. ID, Student, Date, and Status are mandatory fields.
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 border-t flex justify-end gap-2">
                                <button 
                                    className="px-4 py-2 text-sm text-gray-755 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold transition"
                                    onClick={() => setShowTemplateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 font-bold shadow-sm transition"
                                    onClick={handleDownloadTemplate}
                                >
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (view === 'list') {
        const filtered = attendanceList.filter(row => {
            if (filters.name && !(row.name || '').toLowerCase().includes(filters.name.toLowerCase())) {
                return false;
            }
            if (filters.student && !(row.student || '').toLowerCase().includes(filters.student.toLowerCase())) {
                return false;
            }
            if (filters.student_name && !(row.student_name || '').toLowerCase().includes(filters.student_name.toLowerCase())) {
                return false;
            }
            if (filters.program) {
                const groupObj = dropdowns.masterStudentGroups?.find(g => g.value === row.student_group);
                if (!groupObj || groupObj.program !== filters.program) {
                    return false;
                }
            }
            if (filters.student_group && !(row.student_group || '').toLowerCase().includes(filters.student_group.toLowerCase())) {
                return false;
            }
            if (filters.status) {
                const docStatusName = row.docstatus === 0 ? 'Draft' : row.docstatus === 2 ? 'Cancelled' : row.status;
                if ((docStatusName || '').toLowerCase() !== filters.status.toLowerCase()) {
                    return false;
                }
            }
            if (filters.start_date && (!row.date || row.date < filters.start_date)) {
                return false;
            }
            if (filters.end_date && (!row.date || row.date > filters.end_date)) {
                return false;
            }
            return true;
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Student Attendance</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition" onClick={fetchAttendanceList}>Refresh</button>
                        <button 
                            className="px-4 py-2 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-1.5 transition font-semibold" 
                            onClick={handleDownloadAttendance}
                        >
                            📤 Download
                        </button>
                        <button 
                            className="px-4 py-2 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-1.5 transition font-semibold" 
                            onClick={() => { setView('import'); setImportView('list'); }}
                        >
                            📥 Import
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Mark Attendance
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filter By</span>
                        {Object.values(filters).some(v => v !== '') && (
                            <button className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1" onClick={() => setFilters({ name: '', student: '', student_name: '', program: '', student_group: '', status: '', start_date: '', end_date: '' })}>
                                ✕ Clear Filters
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white" placeholder="ID" value={filters.name} onChange={e => setFilters(prev => ({ ...prev, name: e.target.value }))} />
                        </div>
                        <div>
                            <select 
                                className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white text-gray-600" 
                                value={filters.student} 
                                onChange={e => setFilters(prev => ({ ...prev, student: e.target.value }))}
                                disabled={loadingFilterStudents}
                            >
                                <option value="">{loadingFilterStudents ? 'Loading Students...' : 'Student'}</option>
                                {filteredFilterStudents?.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white" placeholder="Student Name" value={filters.student_name} onChange={e => setFilters(prev => ({ ...prev, student_name: e.target.value }))} />
                        </div>
                        <div>
                            <select 
                                className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white text-gray-600" 
                                value={filters.program} 
                                onChange={e => setFilters(prev => ({ ...prev, program: e.target.value, student_group: '', student: '' }))}
                            >
                                <option value="">Program</option>
                                {dropdowns.programs?.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <select 
                                className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white text-gray-600" 
                                value={filters.student_group} 
                                onChange={e => setFilters(prev => ({ ...prev, student_group: e.target.value, student: '' }))}
                            >
                                <option value="">Student Group</option>
                                {filteredFilterStudentGroups?.map(sg => (
                                    <option key={sg.value} value={sg.value}>{sg.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <select className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white text-gray-600" value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                                <option value="">Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Half Day">Half Day</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">From:</span>
                            <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white text-gray-600" value={filters.start_date} onChange={e => setFilters(prev => ({ ...prev, start_date: e.target.value }))} />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">To:</span>
                            <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white text-gray-600" value={filters.end_date} onChange={e => setFilters(prev => ({ ...prev, end_date: e.target.value }))} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Student</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 w-1/4">
                                    <div className="flex justify-between items-center">
                                        <span>Group</span>
                                        {!loadingList && filtered.length > 0 && (
                                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                {Math.min(visibleCount, filtered.length)} of {filtered.length}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No attendance records found.</td></tr>
                            ) : (
                                filtered.slice(0, visibleCount).map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:underline font-medium" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-800">{row.student_name || row.student}</div>
                                            <div className="text-[10px] text-gray-400">{row.student}</div>
                                        </td>
                                        <td className="px-4 py-3">{row.date}</td>
                                        <td className="px-4 py-3">
                                            {row.docstatus === 0 ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                                                    Draft
                                                </span>
                                            ) : row.docstatus === 2 ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500">
                                                    Cancelled
                                                </span>
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                    row.status === 'Present' ? 'bg-green-100 text-green-700' : 
                                                    row.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {row.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{row.student_group || '-'}</td>
                                    </tr>
                                ))
                             )}
                        </tbody>
                    </table>
                </div>

                {filtered.length > 0 && (
                    <div className="flex justify-between items-center mt-6">
                        <div className="flex items-center bg-gray-100 rounded-md p-1 border border-gray-200">
                            {[20, 100, 500, 2500].map(size => (
                                <button
                                    key={size}
                                    onClick={() => {
                                        setPageSize(size);
                                        setVisibleCount(size);
                                    }}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${pageSize === size ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                        
                        {visibleCount < filtered.length && (
                            <button 
                                onClick={() => setVisibleCount(prev => prev + pageSize)}
                                className="px-4 py-1.5 bg-white text-gray-700 text-xs font-semibold rounded border border-gray-300 hover:bg-gray-50 transition shadow-sm"
                            >
                                Load More
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-20">Loading record...</div>;

    const isDocDisabled = form.docstatus > 0;

    return (
        <div className="p-6 max-w-4xl mx-auto pb-32">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">{editingRecord ? `Edit ${editingRecord}` : 'New Student Attendance'}</h2>
                    {!editingRecord ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold uppercase tracking-wider">Not Saved</span>
                    ) : form.docstatus === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 font-bold uppercase tracking-wider">Draft</span>
                    ) : form.docstatus === 2 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 text-red-600 font-bold uppercase tracking-wider">Cancelled</span>
                    ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-green-50 text-green-700 font-bold uppercase tracking-wider">Submitted</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50" onClick={() => setView('list')}>Back</button>
                    
                    {editingRecord && form.docstatus === 0 && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm hover:bg-red-100" onClick={handleDelete}>Delete</button>
                    )}

                    {!isDocDisabled && (
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 shadow-sm" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    )}

                    {editingRecord && form.docstatus === 0 && (
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm" onClick={handleSubmitDoc} disabled={saving}>
                            {saving ? 'Submitting...' : 'Submit'}
                        </button>
                    )}

                    {editingRecord && form.docstatus === 1 && (
                        <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-50 shadow-sm" onClick={handleCancelDoc} disabled={saving}>
                            {saving ? 'Cancelling...' : 'Cancel'}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <div>
                        <label className={labelStyle}>Series</label>
                        <select className={inputStyle} value={form.naming_series} onChange={e => setForm({ ...form, naming_series: e.target.value })} disabled={isDocDisabled}>
                            {dropdowns.namingSeries.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Date *</label>
                        <input type="date" className={inputStyle} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} disabled={isDocDisabled} />
                    </div>
                    <div>
                        <label className={labelStyle}>Student * {loadingStudents && <span style={{ color: '#1890ff', fontSize: '12px' }}>(Loading...)</span>}</label>
                        <select className={inputStyle} value={form.student} onChange={e => setForm({ ...form, student: e.target.value })} disabled={loadingStudents || isDocDisabled}>
                            <option value="">{loadingStudents ? 'Loading Students...' : 'Select Student'}</option>
                            {filteredStudents.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Status *</label>
                        <select className={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={isDocDisabled}>
                            {dropdowns.statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Course Schedule</label>
                        <select className={inputStyle} value={form.course_schedule} onChange={e => setForm({ ...form, course_schedule: e.target.value })} disabled={isDocDisabled}>
                            <option value="">Select Schedule</option>
                            {dropdowns.courseSchedules.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Program</label>
                        <select className={inputStyle} value={form.program} onChange={e => {
                            setForm({ 
                                ...form, 
                                program: e.target.value,
                                student_group: '', 
                                student: '' 
                            });
                        }} disabled={isDocDisabled}>
                            <option value="">Select Program</option>
                            {dropdowns.programs.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Student Group</label>
                        <select className={inputStyle} value={form.student_group} onChange={e => {
                            setForm({
                                ...form,
                                student_group: e.target.value,
                                student: ''
                            });
                        }} disabled={isDocDisabled}>
                            <option value="">Select Group</option>
                            {filteredStudentGroups.map(sg => <option key={sg.value} value={sg.value}>{sg.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;
