import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import API from '../../services/api';
import { 
    Card, Col, Row, Button, Select, Input, DatePicker, notification, Spin, Space, Divider, Typography, Form, Modal, AutoComplete
} from 'antd';
import { 
    PrinterOutlined, DownloadOutlined, ArrowLeftOutlined, SearchOutlined, SaveOutlined, EyeOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import html2pdf from 'html2pdf.js';
import schoolHeader from '../../assets/images/school_header.jpg';

const { Title, Text } = Typography;
const RECORDS_PATH = 'schooler_system/certificates/records';

export default function TrialCertificate() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const certificateRef = useRef(null);

    const [searching, setSearching] = useState(false);
    const [students, setStudents] = useState([]);
    const [saving, setSaving] = useState(false);
    const [certificateNo, setCertificateNo] = useState('');
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    
    // Masters and Group States
    const [loadingMasters, setLoadingMasters] = useState(false);
    const [boards, setBoards] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [allStudentGroups, setAllStudentGroups] = useState([]);
    const [filteredPrograms, setFilteredPrograms] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [selectedBoard, setSelectedBoard] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [studentsInGroup, setStudentsInGroup] = useState([]);
    const [loadingGroupStudents, setLoadingGroupStudents] = useState(false);
    const [studentsInProgram, setStudentsInProgram] = useState([]);
    const [loadingProgramStudents, setLoadingProgramStudents] = useState(false);

    // Certificate preview live state
    const [previewData, setPreviewData] = useState({
        certificateNo: '',
        date: dayjs().format('DD/MM/YYYY'),
        studentName: '',
        fatherName: '',
        grNo: '',
        rollNo: '',
        std: '',
        seatNo: '',
        academicYear: `${dayjs().year()}-${String(dayjs().year() + 1).slice(-2)}`,
        principalName: 'Neeraj Kaushesh',
        prefix: 'Master',
        heShe: 'He',
        hisHer: 'His',
        himHer: 'him',
        relation: 's/o of Sh.',
        examName: 'Secondary School Certificate Examination',
        boardName: 'GSEB',
        attemptType: 'First Trial'
    });

    useEffect(() => {
        const fetchMasters = async () => {
            setLoadingMasters(true);
            try {
                const [pRes, sgRes, bRes] = await Promise.all([
                    API.get('/api/resource/Program?fields=["name","custom_board"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Student Group?fields=["name","program"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Company?limit_page_length=None').catch(() => ({ data: { data: [] } }))
                ]);
                const fetchedPrograms = pRes.data.data || [];
                setPrograms(fetchedPrograms);
                setFilteredPrograms(fetchedPrograms);
                
                const groups = sgRes.data.data || [];
                setAllStudentGroups(groups);
                setFilteredGroups(groups);
                
                setBoards(bRes.data.data || []);
            } catch (err) {
                console.error('Error fetching programs or student groups:', err);
            } finally {
                setLoadingMasters(false);
            }
        };
        fetchMasters();
    }, []);

    useEffect(() => {
        // Fetch next certificate number from Firebase on mount
        const getNextCertNo = async () => {
            try {
                const recordsRef = collection(db, RECORDS_PATH);
                const q = query(recordsRef, orderBy('created_at', 'desc'), limit(1));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const lastDoc = snapshot.docs[0].data();
                    const lastNo = parseInt(lastDoc.certificateNo, 10);
                    if (!isNaN(lastNo)) {
                        setCertificateNo(String(lastNo + 1));
                        form.setFieldsValue({ certificateNo: String(lastNo + 1) });
                        setPreviewData(prev => ({ ...prev, certificateNo: String(lastNo + 1) }));
                    } else {
                        setCertificateNo('1');
                        form.setFieldsValue({ certificateNo: '1' });
                        setPreviewData(prev => ({ ...prev, certificateNo: '1' }));
                    }
                } else {
                    setCertificateNo('1');
                    form.setFieldsValue({ certificateNo: '1' });
                    setPreviewData(prev => ({ ...prev, certificateNo: '1' }));
                }
            } catch (err) {
                console.error("Error generating next certificate no:", err);
                setCertificateNo('1');
                form.setFieldsValue({ certificateNo: '1' });
                setPreviewData(prev => ({ ...prev, certificateNo: '1' }));
            }
        };

        getNextCertNo();
    }, [form]);

    // Load student profiles for the selected program
    const fetchStudentsForProgram = async (programName) => {
        if (!programName) {
            setStudentsInProgram([]);
            return;
        }
        setLoadingProgramStudents(true);
        try {
            const fieldsList = JSON.stringify(["name", "student_name", "first_name", "middle_name", "last_name", "gender", "date_of_birth", "program", "roll_number", "gr_number"]);
            const filters = JSON.stringify([["program", "=", programName]]);
            const res = await API.get(`/api/resource/Student?filters=${filters}&fields=${fieldsList}&limit_page_length=1000`);
            const programStudents = res.data?.data || [];
            setStudentsInProgram(programStudents);
            setStudents(programStudents);
        } catch (err) {
            console.error("Failed to load students for program:", err);
        } finally {
            setLoadingProgramStudents(false);
        }
    };

    // Handle board change
    const handleBoardChange = (value) => {
        setSelectedBoard(value);
        if (value) {
            const fProgs = programs.filter(p => {
                const pBoard = (p.custom_board || '').toString().trim().toLowerCase();
                const fBoard = (value || '').toString().trim().toLowerCase();
                return pBoard === fBoard;
            });
            setFilteredPrograms(fProgs);
            
            const fGroups = allStudentGroups.filter(sg => {
                const prog = programs.find(p => p.name === sg.program);
                const pBoard = (prog?.custom_board || '').toString().trim().toLowerCase();
                const fBoard = (value || '').toString().trim().toLowerCase();
                return pBoard === fBoard;
            });
            setFilteredGroups(fGroups);
        } else {
            setFilteredPrograms(programs);
            setFilteredGroups(allStudentGroups);
        }
        setSelectedProgram('');
        setSelectedGroup('');
        form.setFieldsValue({ board: value, program: undefined, studentGroup: undefined, studentSearch: undefined, studentName: '', grNo: '', rollNo: '', fatherName: '' });
        setStudentsInProgram([]);
        setStudentsInGroup([]);
        setStudents([]);
    };

    // Filter student groups when program changes
    const handleProgramChange = (value) => {
        setSelectedProgram(value);
        if (value) {
            setFilteredGroups(allStudentGroups.filter(g => g.program === value));
            form.setFieldsValue({ std: value, program: value });
            setPreviewData(prev => ({ ...prev, std: value }));
            fetchStudentsForProgram(value);
        } else {
            if (selectedBoard) {
                const fGroups = allStudentGroups.filter(sg => {
                    const prog = programs.find(p => p.name === sg.program);
                    const pBoard = (prog?.custom_board || '').toString().trim().toLowerCase();
                    const fBoard = (selectedBoard || '').toString().trim().toLowerCase();
                    return pBoard === fBoard;
                });
                setFilteredGroups(fGroups);
            } else {
                setFilteredGroups(allStudentGroups);
            }
            form.setFieldsValue({ program: undefined });
            setStudentsInProgram([]);
            setStudents([]);
        }
        // Clear dependent fields
        setSelectedGroup('');
        form.setFieldsValue({ studentGroup: undefined, studentSearch: undefined, studentName: '', grNo: '', rollNo: '', fatherName: '' });
        setStudentsInGroup([]);
    };

    // Load group members and their full profiles when a student group is selected
    const handleGroupChange = async (value) => {
        setSelectedGroup(value);
        // Clear dependent fields
        form.setFieldsValue({ studentSearch: undefined, studentName: '', grNo: '', rollNo: '', fatherName: '' });
        setStudentsInGroup([]);
        setStudents([]);

        if (!value) {
            if (selectedProgram) {
                setStudents(studentsInProgram);
            }
            return;
        }

        setLoadingGroupStudents(true);
        try {
            const sgRes = await API.get(`/api/resource/Student Group/${encodeURIComponent(value)}`);
            const groupStudents = sgRes.data.data?.students || [];
            if (groupStudents.length === 0) {
                setLoadingGroupStudents(false);
                return;
            }

            const studentIds = groupStudents.map(s => s.student);
            const fieldsList = JSON.stringify(["name", "student_name", "first_name", "middle_name", "last_name", "gender", "date_of_birth", "program", "roll_number", "gr_number"]);
            const filters = JSON.stringify([["name", "in", studentIds]]);
            const profileRes = await API.get(`/api/resource/Student?filters=${filters}&fields=${fieldsList}&limit_page_length=1000`);

            const detailedStudents = profileRes.data.data || [];
            setStudentsInGroup(detailedStudents);
            
            if (selectedProgram) {
                setStudents(detailedStudents.filter(s => s.program === selectedProgram));
            } else {
                setStudents(detailedStudents);
            }
        } catch (err) {
            console.error("Failed to load students for group:", err);
        } finally {
            setLoadingGroupStudents(false);
        }
    };

    const handleStudentSelectFocus = () => {
        if (selectedGroup && studentsInGroup.length > 0) {
            if (selectedProgram) {
                setStudents(studentsInGroup.filter(s => s.program === selectedProgram));
            } else {
                setStudents(studentsInGroup);
            }
        } else if (selectedProgram && studentsInProgram.length > 0) {
            setStudents(studentsInProgram);
        }
    };

    // Handle student search
    const handleStudentSearch = async (value) => {
        if (selectedGroup) {
            const baseList = selectedProgram 
                ? studentsInGroup.filter(s => s.program === selectedProgram)
                : studentsInGroup;
            if (!value || value.trim().length === 0) {
                setStudents(baseList);
            } else {
                const lowerVal = value.toLowerCase();
                const filtered = baseList.filter(s => 
                    (s.student_name && s.student_name.toLowerCase().includes(lowerVal)) ||
                    (s.name && s.name.toLowerCase().includes(lowerVal))
                );
                setStudents(filtered);
            }
            return;
        }

        if (selectedProgram) {
            if (!value || value.trim().length === 0) {
                setStudents(studentsInProgram);
            } else {
                const lowerVal = value.toLowerCase();
                const filtered = studentsInProgram.filter(s => 
                    (s.student_name && s.student_name.toLowerCase().includes(lowerVal)) ||
                    (s.name && s.name.toLowerCase().includes(lowerVal))
                );
                setStudents(filtered);
            }
            return;
        }

        if (!value || value.trim().length < 2) {
            setStudents([]);
            return;
        }

        setSearching(true);
        try {
            let additionalFilters = [];
            if (selectedBoard) {
                const validPrograms = programs.filter(p => {
                    const pBoard = (p.custom_board || '').toString().trim().toLowerCase();
                    const fBoard = (selectedBoard || '').toString().trim().toLowerCase();
                    return pBoard === fBoard;
                }).map(p => p.name);
                if (validPrograms.length > 0) {
                    additionalFilters.push(["program", "in", validPrograms]);
                }
            }
            
            const filters = [
                ["student_name", "like", `%${value}%`],
                ...additionalFilters
            ];
            const res = await API.get(
                `/api/resource/Student?filters=${JSON.stringify(filters)}&fields=["name","student_name","first_name","middle_name","last_name","gender","date_of_birth","program","roll_number","gr_number"]&limit_page_length=20`
            );
            setStudents(res.data.data || []);
        } catch (err) {
            console.error("Student search failed:", err);
        } finally {
            setSearching(false);
        }
    };

    // Auto-fill values and configure pronouns when a student is selected
    const handleStudentSelect = async (studentId) => {
        const student = students.find(s => s.name === studentId);
        if (!student) return;

        const fullName = student.student_name || `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}`.trim();
        const grNo = student.gr_number || '';
        const rollNo = student.roll_number || '';
        
        // Extract a clean class/standard name if possible
        const std = student.program || '';

        // Extract father's name ( Gujarati/Indian fallback - middle_name or split student_name)
        let fatherName = '';
        if (student.middle_name) {
            fatherName = student.middle_name.trim();
        } else if (fullName) {
            const parts = fullName.trim().split(/\s+/);
            if (parts.length > 2) {
                fatherName = parts.slice(1, parts.length - 1).join(' ').trim();
            }
        }

        // Determine default pronouns based on ERPNext gender field
        let prefix = 'Student';
        let heShe = 'They';
        let hisHer = 'Their';
        let himHer = 'them';
        let relation = 'child of Sh.';

        if (student.gender?.toLowerCase() === 'male') {
            prefix = 'Master';
            heShe = 'He';
            hisHer = 'His';
            himHer = 'him';
            relation = 's/o of Sh.';
        } else if (student.gender?.toLowerCase() === 'female') {
            prefix = 'Miss';
            heShe = 'She';
            hisHer = 'Her';
            himHer = 'her';
            relation = 'd/o of Sh.';
        }

        const updatedFields = {
            studentName: fullName,
            studentId: student.name,
            grNo,
            rollNo,
            std,
            fatherName,
            gender: student.gender || '',
            prefix,
            heShe,
            hisHer,
            himHer,
            relation
        };

        form.setFieldsValue(updatedFields);
        
        setPreviewData(prev => ({
            ...prev,
            ...updatedFields,
            studentName: fullName,
            grNo,
            rollNo,
            std,
            fatherName,
            gender: student.gender || ''
        }));

        // Fetch full student details to retrieve guardian_name if available
        try {
            const res = await API.get(`/api/resource/Student/${encodeURIComponent(studentId)}`);
            const fullStudent = res.data?.data;
            if (fullStudent && fullStudent.guardians && fullStudent.guardians.length > 0) {
                // Look for a guardian with relation 'Father' first, fallback to the first guardian
                const fatherGuardian = fullStudent.guardians.find(g => g.relation?.toLowerCase() === 'father') 
                                    || fullStudent.guardians[0];
                if (fatherGuardian && fatherGuardian.guardian_name) {
                    const fetchedGuardianName = fatherGuardian.guardian_name.trim();
                    form.setFieldsValue({ fatherName: fetchedGuardianName });
                    setPreviewData(prev => ({ ...prev, fatherName: fetchedGuardianName }));
                }
            }
        } catch (err) {
            console.error("Failed to fetch student details for guardian information:", err);
        }
    };

    // Update preview data as form inputs change
    const handleFormValuesChange = (changedValues, allValues) => {
        setPreviewData(prev => {
            const next = { ...prev, ...allValues };
            
            // Format dates for display
            if (allValues.date) {
                next.date = dayjs(allValues.date).format('DD/MM/YYYY');
            }
            return next;
        });
    };

    // Save record to Firebase Firestore
    const saveCertificateRecord = async () => {
        const values = form.getFieldsValue();
        if (!values.studentName) {
            notification.error({ message: 'Validation Error', description: 'Please select a student first.' });
            return null;
        }

        setSaving(true);
        try {
            const docRef = await addDoc(collection(db, RECORDS_PATH), {
                certificateNo: values.certificateNo || certificateNo,
                date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                studentName: values.studentName,
                fatherName: values.fatherName || '',
                studentId: values.studentId || '',
                grNo: values.grNo || '',
                rollNo: values.rollNo || '',
                std: values.std || '',
                seatNo: values.seatNo || '',
                gender: values.gender || '',
                academicYear: values.academicYear || '',
                type: 'Trial',
                principalName: values.principalName || 'Neeraj Kaushesh',
                prefix: values.prefix || '',
                heShe: values.heShe || '',
                hisHer: values.hisHer || '',
                himHer: values.himHer || '',
                relation: values.relation || '',
                examName: values.examName || 'Secondary School Certificate Examination',
                boardName: values.boardName || 'GSEB',
                attemptType: values.attemptType || 'First Trial',
                created_at: serverTimestamp()
            });

            notification.success({ 
                message: 'Certificate Saved', 
                description: `Trial Certificate No. ${values.certificateNo || certificateNo} has been logged in history.` 
            });

            // Increment local certificate counter for next issue
            const nextNo = parseInt(values.certificateNo || certificateNo, 10) + 1;
            if (!isNaN(nextNo)) {
                setCertificateNo(String(nextNo));
                form.setFieldsValue({ certificateNo: String(nextNo) });
            }

            return docRef.id;
        } catch (error) {
            console.error("Error saving certificate record:", error);
            notification.error({ 
                message: 'Save Failed', 
                description: 'Could not store the certificate log in Firestore.' 
            });
            return null;
        } finally {
            setSaving(false);
        }
    };

    // Trigger portrait A4 browser print dialog
    const handlePrint = async () => {
        const values = form.getFieldsValue();
        if (!values.studentName) {
            notification.error({ message: 'Validation Error', description: 'Please select a student before printing.' });
            return;
        }

        // Save to Firebase first
        await saveCertificateRecord();

        // Print using window.print()
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // Download high-fidelity PDF with html2pdf.js
    const handleDownloadPDF = async () => {
        const values = form.getFieldsValue();
        if (!values.studentName) {
            notification.error({ message: 'Validation Error', description: 'Please select a student before downloading.' });
            return;
        }

        // Save to Firebase first
        await saveCertificateRecord();

        const element = document.getElementById('certificate-print-area');
        const opt = {
            margin: 0,
            filename: `Trial_${values.studentName.replace(/\s+/g, '_')}_No_${values.certificateNo || certificateNo}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { 
                scale: 3, 
                useCORS: true, 
                letterRendering: true,
                logging: false
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Execute download
        html2pdf().from(element).set(opt).save();
    };

    const handleOpenPreview = () => {
        const values = form.getFieldsValue();
        if (!values.studentName) {
            notification.error({ message: 'Validation Error', description: 'Please select a student before previewing.' });
            return;
        }
        setPreviewModalVisible(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto pb-48">
            {/* Header / Back */}
            <div className="flex justify-between items-center mb-6 no-print">
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => navigate('/certificates/dashboard')}
                    className="border-gray-300 text-gray-700 hover:text-red-700 hover:border-red-700 font-semibold"
                >
                    Back to Overview
                </Button>
                <h3 className="text-xl font-extrabold text-gray-900 m-0">Issue Trial Certificate</h3>
            </div>

            <div className="max-w-3xl mx-auto no-print">
                <Card title={<span className="font-bold text-gray-800">Certificate Parameters (Trial)</span>} className="shadow-sm border-gray-100">
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{
                            certificateNo: certificateNo,
                            date: dayjs(),
                            academicYear: `${dayjs().year()}-${String(dayjs().year() + 1).slice(-2)}`,
                            principalName: 'Neeraj Kaushesh',
                            prefix: 'Master',
                            heShe: 'He',
                            hisHer: 'His',
                            himHer: 'him',
                            relation: 's/o of Sh.',
                            program: '',
                            studentGroup: '',
                            rollNo: '',
                            seatNo: '',
                            examName: 'Secondary School Certificate Examination',
                            boardName: 'GSEB',
                            attemptType: 'First Trial'
                        }}
                        onValuesChange={handleFormValuesChange}
                    >
                        <Divider orientation="left" className="m-0 text-red-800 font-bold text-xs uppercase tracking-wide">1. Student Lookup</Divider>
                        
                        <Row gutter={12} className="mt-3">
                            <Col span={8}>
                                <Form.Item label="Board" name="board">
                                    <Select 
                                        placeholder="Select Board" 
                                        showSearch
                                        allowClear
                                        onChange={handleBoardChange}
                                        disabled={loadingMasters}
                                    >
                                        {boards.map(b => (
                                            <Select.Option key={b.name} value={b.name}>{b.name}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Program (Class)" name="program">
                                    <Select
                                        showSearch
                                        allowClear
                                        placeholder="Select program..."
                                        onChange={handleProgramChange}
                                        disabled={loadingMasters}
                                        optionFilterProp="children"
                                    >
                                        {filteredPrograms.map(p => (
                                            <Select.Option key={p.name} value={p.name}>{p.name}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Student Group" name="studentGroup">
                                    <Select
                                        showSearch
                                        allowClear
                                        placeholder="Select student group..."
                                        onChange={handleGroupChange}
                                        disabled={loadingMasters}
                                        optionFilterProp="children"
                                    >
                                        {filteredGroups.map(g => (
                                            <Select.Option key={g.name} value={g.name}>{g.name}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item 
                            label="Search ERPNext Student" 
                            name="studentSearch"
                            help={
                                selectedGroup 
                                    ? "Filter students in the selected group or type to search" 
                                    : (selectedProgram 
                                        ? "Filter students in the selected program or type to search" 
                                        : "Type student name to search")
                            }
                            className="mt-2"
                        >
                            <Select
                                showSearch
                                placeholder={
                                    selectedGroup 
                                        ? "Select a student from group..." 
                                        : (selectedProgram 
                                            ? "Select a student from program..." 
                                            : "Search by student name...")
                                }
                                defaultActiveFirstOption={false}
                                filterOption={false}
                                onSearch={handleStudentSearch}
                                onChange={handleStudentSelect}
                                onFocus={handleStudentSelectFocus}
                                notFoundContent={loadingGroupStudents || loadingProgramStudents || searching ? <Spin size="small" /> : null}
                                suffixIcon={<SearchOutlined />}
                                className="w-full"
                            >
                                {students.map(s => (
                                    <Select.Option key={s.name} value={s.name}>
                                        {s.student_name} ({s.name}) - Roll {s.roll_number || 'N/A'}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* Hidden studentId field */}
                        <Form.Item name="studentId" noStyle><Input type="hidden" /></Form.Item>
                        <Form.Item name="gender" noStyle><Input type="hidden" /></Form.Item>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item 
                                    label="Student Full Name" 
                                    name="studentName" 
                                    rules={[{ required: true, message: 'Student name is required' }]}
                                >
                                    <Input placeholder="Autofilled or enter manually" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item 
                                    label="Father/Guardian Name" 
                                    name="fatherName" 
                                    rules={[{ required: true, message: 'Father/guardian name is required' }]}
                                >
                                    <Input placeholder="Autofilled middle name or enter manually" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={6}>
                                <Form.Item label="G.R. No" name="grNo">
                                    <Input placeholder="Enter GR Number" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label="Roll No" name="rollNo">
                                    <Input placeholder="Enter Roll Number" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label="Std (Class)" name="std">
                                    <Input placeholder="e.g. X" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label="GSEB Seat Number" name="seatNo">
                                    <Input placeholder="e.g. G123456" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={10}>
                                <Form.Item label="Exam Name" name="examName" rules={[{ required: true, message: 'Exam name is required' }]}>
                                    <Input placeholder="e.g. Secondary School Certificate Examination" />
                                </Form.Item>
                            </Col>
                            <Col span={7}>
                                <Form.Item label="Board Name" name="boardName" rules={[{ required: true, message: 'Board name is required' }]}>
                                    <Input placeholder="e.g. GSEB" />
                                </Form.Item>
                            </Col>
                            <Col span={7}>
                                <Form.Item label="Attempt / Trial" name="attemptType" rules={[{ required: true, message: 'Attempt type is required' }]}>
                                    <Input placeholder="e.g. First Trial" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left" className="m-0 text-red-800 font-bold text-xs uppercase tracking-wide">2. Certificate Log Details</Divider>
                        
                        <Row gutter={12} className="mt-3">
                            <Col span={8}>
                                <Form.Item label="Certificate No" name="certificateNo" rules={[{ required: true }]}>
                                    <Input placeholder="Auto-incremented" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Date of Issue" name="date" rules={[{ required: true }]}>
                                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Academic Session" name="academicYear">
                                    <Input placeholder="e.g. 2025-26" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Principal Name" name="principalName">
                            <Input placeholder="e.g. Neeraj Kaushesh" />
                        </Form.Item>

                        <Divider orientation="left" className="m-0 text-red-800 font-bold text-xs uppercase tracking-wide">3. Pronoun Adjustments (Overrides)</Divider>
                        
                        <Row gutter={12} className="mt-3">
                            <Col span={8}>
                                <Form.Item label="Prefix" name="prefix">
                                    <Select>
                                        <Select.Option value="Master">Master</Select.Option>
                                        <Select.Option value="Miss">Miss</Select.Option>
                                        <Select.Option value="Student">Student</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="He/She" name="heShe">
                                    <Select>
                                        <Select.Option value="He">He</Select.Option>
                                        <Select.Option value="She">She</Select.Option>
                                        <Select.Option value="They">They</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="His/Her" name="hisHer">
                                    <Select>
                                        <Select.Option value="His">His</Select.Option>
                                        <Select.Option value="Her">Her</Select.Option>
                                        <Select.Option value="Their">Their</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item label="Relation (son/daughter of Sh.)" name="relation">
                                    <Select>
                                        <Select.Option value="s/o of Sh.">s/o of Sh.</Select.Option>
                                        <Select.Option value="d/o of Sh.">d/o of Sh.</Select.Option>
                                        <Select.Option value="child of Sh.">child of Sh.</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="him/her (wishes)" name="himHer">
                                    <Select>
                                        <Select.Option value="him">him</Select.Option>
                                        <Select.Option value="her">her</Select.Option>
                                        <Select.Option value="them">them</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <div className="flex gap-3 justify-end mt-4">
                            <Button 
                                type="default" 
                                icon={<EyeOutlined />} 
                                onClick={handleOpenPreview}
                                className="border-red-700 text-red-700 hover:text-red-800 hover:border-red-800 font-semibold"
                            >
                                Preview Certificate
                            </Button>
                            <Button 
                                type="primary" 
                                icon={<SaveOutlined />} 
                                loading={saving} 
                                onClick={saveCertificateRecord}
                                className="bg-indigo-600 hover:bg-indigo-700 border-none font-semibold text-white"
                            >
                                Save Only
                            </Button>
                        </div>
                    </Form>
                </Card>
            </div>

            {/* Preview Modal */}
            <Modal
                title={<span className="font-extrabold text-gray-800">Certificate Preview (Trial)</span>}
                open={previewModalVisible}
                onCancel={() => setPreviewModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setPreviewModalVisible(false)}>
                        Close
                    </Button>,
                    <Button 
                        key="print" 
                        icon={<PrinterOutlined />} 
                        onClick={handlePrint}
                        className="border-red-700 text-red-700 hover:text-white hover:bg-red-700 font-semibold"
                    >
                        Print Certificate
                    </Button>,
                    <Button 
                        key="download" 
                        type="primary" 
                        icon={<DownloadOutlined />} 
                        onClick={handleDownloadPDF}
                        className="bg-red-700 hover:bg-red-800 border-none font-semibold text-white"
                    >
                        Download PDF
                    </Button>
                ]}
                width={950}
                centered
                destroyOnHidden
                className="no-print"
            >
                <div className="w-full overflow-x-auto bg-gray-100 p-6 rounded border border-gray-200 flex justify-center">
                    <div 
                        id="certificate-print-area"
                        ref={certificateRef}
                        className="bg-white shadow-md text-black"
                        style={{
                            width: '210mm',
                            height: '297mm',
                            padding: '8mm',
                            boxSizing: 'border-box',
                            position: 'relative',
                            fontFamily: '"Times New Roman", Times, serif',
                            backgroundColor: '#ffffff'
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                border: '6px double #000000',
                                padding: '16mm 14mm',
                                boxSizing: 'border-box',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Header Section */}
                            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '10px', width: '100%' }}>
                                <img src={schoolHeader} alt="School Header" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                            </div>

                            {/* Divider Line */}
                            <div style={{ borderTop: '1.5px solid #000000', marginTop: '5px', marginBottom: '15px', width: '100%' }} />

                            {/* Title centered */}
                            <div style={{ textAlign: 'center', marginTop: '10px', marginBottom: '2px' }}>
                                <span style={{ 
                                    fontSize: '26px', 
                                    fontWeight: 'bold', 
                                    color: '#000000',
                                    fontFamily: '"Times New Roman", Times, serif',
                                    letterSpacing: '1px'
                                }}>
                                    TRIAL CERTIFICATE
                                </span>
                            </div>
                            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                <span style={{ 
                                    fontSize: '18px', 
                                    fontWeight: 'bold', 
                                    color: '#000000',
                                    fontFamily: '"Times New Roman", Times, serif',
                                    letterSpacing: '0.5px'
                                }}>
                                    SCHOOL INDEX NO. 55.0304
                                </span>
                            </div>

                            {/* Metadata Details (Cert no / Date) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', color: '#000000', fontFamily: '"Times New Roman", Times, serif', marginBottom: '20px' }}>
                                <div>
                                    Certificate No. &nbsp; <strong>{previewData.certificateNo || '______'}</strong>
                                </div>
                                <div>
                                    Date: &nbsp; <strong>{previewData.date}</strong>
                                </div>
                            </div>

                            {/* Paragraph Content */}
                            <div 
                                style={{ 
                                    fontSize: '18.5px', 
                                    textAlign: 'justify', 
                                    lineHeight: '2.3',
                                    color: '#000000',
                                    fontFamily: '"Times New Roman", Times, serif',
                                    marginTop: '15px',
                                    textIndent: '30px'
                                }}
                            >
                                This is to certify that {previewData.prefix ? previewData.prefix + ' ' : ''}
                                <strong style={{ textTransform: 'uppercase', fontSize: '19.5px' }}>{previewData.studentName || '________________________________'}</strong> 
                                &nbsp;{previewData.relation || 's/o of Sh.'}&nbsp;
                                <strong style={{ textTransform: 'uppercase', fontSize: '19.5px' }}>{previewData.fatherName || '________________________'}</strong>
                                , studying in class <strong>{previewData.std || '______'}</strong>
                                , (GR.NO. <strong>{previewData.grNo || '______'}</strong>)
                                in the academic session <strong>{previewData.academicYear || '______'}</strong> is a bonafide student of Shree Saraswati Vidhyalay, Gandhinagar.
                                {previewData.heShe} has passed {previewData.examName || 'Secondary School Certificate Examination'} conducted by {previewData.boardName || 'GSEB'} in the {previewData.attemptType || 'First Trial'}.
                            </div>

                            {/* Seat number */}
                            <div 
                                style={{ 
                                    fontSize: '18.5px', 
                                    color: '#000000',
                                    fontFamily: '"Times New Roman", Times, serif',
                                    marginTop: '15px'
                                }}
                            >
                                {previewData.hisHer} seat number was <strong>{previewData.seatNo || '________________'}</strong>
                            </div>

                            {/* Character & Wishes */}
                            <div 
                                style={{ 
                                    fontSize: '18.5px', 
                                    color: '#000000',
                                    fontFamily: '"Times New Roman", Times, serif',
                                    marginTop: '15px'
                                }}
                            >
                                {previewData.heShe} bears a good moral character. I wish {previewData.himHer} success in all the future endeavours.
                            </div>

                            {/* Signature Space on the Left Bottom */}
                            <div style={{ position: 'absolute', bottom: '20mm', left: '16mm', fontSize: '18px', color: '#000000', fontFamily: '"Times New Roman", Times, serif' }}>
                                {/* Stamp outline box */}
                                <div style={{ width: '130px', height: '60px', border: '1px solid #c0c0c0', marginBottom: '15px' }} />
                                <strong>{previewData.principalName}</strong>
                                <div style={{ marginTop: '2px', fontSize: '16px' }}>Principal</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Custom CSS specifically for window.print() style targets */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
                @media print {
                    /* Hide everything except certificate print area */
                    body * {
                        visibility: hidden;
                        background: none !important;
                    }
                    .no-print, .no-print * {
                        display: none !important;
                        height: 0 !important;
                        width: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    #certificate-print-area, #certificate-print-area * {
                        visibility: visible !important;
                    }
                    #certificate-print-area {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        padding: 8mm !important;
                        background: #ffffff !important;
                        box-sizing: border-box !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                    #certificate-print-area > div {
                        width: 100% !important;
                        height: 100% !important;
                        border: 6px double #000000 !important;
                        padding: 16mm 14mm !important;
                        box-sizing: border-box !important;
                    }
                    @page {
                        size: portrait;
                        margin: 0;
                    }
                }
                `
            }} />
        </div>
    );
}
